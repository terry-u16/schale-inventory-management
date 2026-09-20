//! 前置DP × 後置DP による厳密確率計算。
//!
//! 「ある配置を含む盤面の個数 = pref[配置直前の状態] × suf[配置直後の状態]」
//! という恒等式により、配置の列挙もサンプリングもせずに、各マスが各アイテム
//! グループの配置で覆われる回数を厳密に数える。
//!
//! 状態空間は counter.rs のDPと同一（位置 col*HEIGHT+row、残り個数 c、
//! 行の埋まり w_bits）。DPの累加は f64 で行う: 総配置数は u64 を超え得る
//! （例: 1x1x7個 x3 で約1.6e21 > u64.max）ため。典型入力（<2^53）では
//! 整数として厳密であり、それを超えても相対誤差は1e-15程度で表示
//! （小数点1桁）に全く影響しない。
//!
//! ## メモリ設計（全層を保持しない）
//! 1層は c_total × 1024(w状態) × 8B。全46層 × (suf + pref) を素直に持つと
//! 最悪ケース（7/7/7個、c_total=512）で約385MiB 必要になる。そこで:
//! - すべての遷移（skip は +1、place は高さ4でも次列の先頭まで）は
//!   「同列の下側の位置」か「次列の先頭位置」にしか飛ばない。
//! - ゆえに各列の suf は「次列の先頭ベクトル」1本から列内の後進スイープで
//!   再計算できる。列先頭ベクトル10本（チェックポイント）だけ保存し、
//!   前進の数え上げの際に列ごとに再構築する。
//! - pref は「同列の上側からの伝播 + 次列先頭への書き込み」で列単位に
//!   確定するので、現在列の5層 + 次列先頭への累積1層だけで数え上げ可能。
//! 合計の保持層は 10 + 5 + 5 + 1 = 21層で、最悪ケースでも約85MiB。

use crate::{
    grid::{Coord, Map2d},
    problem::GameState,
};
use anyhow::{ensure, Result};

/// 各行の「先に何マス埋まっているか(wi: 0..=3)」を2bitずつ詰めた状態。
type WBits = u16;
/// 1行あたりに割り当てるビット数。wiは0..=3なので2bit。
const W_BITS_PER_ROW: usize = 2;
/// 1行ぶんの値を取り出すためのマスク(0b11)。
const W_MASK: WBits = (1 << W_BITS_PER_ROW) - 1;
/// w_bits の全状態数。2bit x 5行 = 10bit なので 2^10 = 1024。
const W_STATE_COUNT: usize = 1 << (GameState::HEIGHT * W_BITS_PER_ROW);
/// 盤面の位置数。p = col * HEIGHT + row（counter.rs と同一の col-major）。
const POS_COUNT: usize = GameState::WIDTH * GameState::HEIGHT;

/// row 行目の wi を 1 減らす（0 のときは 0 のまま）。
fn dec_w(w_bits: WBits, row: usize) -> WBits {
    let shift = row * W_BITS_PER_ROW;
    let cur = (w_bits >> shift) & W_MASK;
    let next = if cur == 0 { 0 } else { cur - 1 };
    (w_bits & !(W_MASK << shift)) | (next << shift)
}

/// 位置 p に高さ height のアイテムを置いたときの遷移先位置。
/// 配置可能判定済みなので next_row <= HEIGHT が保証され、
/// 結果は p より大きい（最大で次列の先頭）。
fn place_next_pos(p: usize, height: usize) -> usize {
    let row = p % GameState::HEIGHT;
    let col = p / GameState::HEIGHT;
    let next_row = row + height;
    if next_row >= GameState::HEIGHT {
        (col + 1) * GameState::HEIGHT
    } else {
        col * GameState::HEIGHT + next_row
    }
}

/// 回転を含めた配置変異。正方形は回転変異を持たない。
#[derive(Clone, Copy)]
struct Variant {
    group: usize,
    height: usize,
    width: usize,
}

/// グループの c 行の遷移対応（c_total 行のうち置ける行のみ）。
struct GroupRows {
    sel: Vec<usize>,
    up: Vec<usize>,
}

/// (置く前の w, 置いたあとの w) の対。new_w は valid_w に対して単射。
type PlaceTable = Vec<(usize, usize)>;

/// 遷移テーブル一式（suf の列再計算と pref の数え上げで共有する）。
struct Transition {
    variants: Vec<Variant>,
    geom: Vec<Vec<bool>>,
    place_next: Vec<Vec<usize>>,
    place_tables: Vec<Vec<PlaceTable>>,
    group_rows: Vec<Option<GroupRows>>,
    c_total: usize,
}

/// 列 col（位置 col*HEIGHT..+HEIGHT-1）の後置DPベクトルを col_buf[row] に
/// 計算する。外部依存は次列の先頭ベクトル next_top（= suf[(col+1)*HEIGHT]）
/// だけ。同列の下側の行は先に計算済みの col_buf を使う。
fn compute_column_suf(
    col: usize,
    next_top: &[f64],
    col_buf: &mut [Vec<f64>],
    tr: &Transition,
) {
    let c_total = tr.c_total;
    for row in (0..GameState::HEIGHT).rev() {
        let p = col * GameState::HEIGHT + row;
        let (_, tail) = col_buf.split_at_mut(row);
        let (cur, rest) = tail.split_first_mut().expect("col_buf has HEIGHT rows");
        cur.fill(0.0);

        // skip 遷移: suf[p][c][w] += suf[p+1][c][dec_w(w, row)]
        // 最下段のとき p+1 は次列の先頭（next_top）
        let below: &[f64] = if row + 1 < GameState::HEIGHT {
            &rest[0]
        } else {
            next_top
        };
        for c in 0..c_total {
            let base = c * W_STATE_COUNT;
            for w in 0..W_STATE_COUNT {
                let v = below[base + dec_w(w as WBits, row) as usize];
                if v != 0.0 {
                    cur[base + w] += v;
                }
            }
        }

        // place 遷移: suf[p][sel][valid_w] += suf[place_next][up][new_w]
        for (vi, variant) in tr.variants.iter().enumerate() {
            if !tr.geom[p][vi] {
                continue;
            }
            let Some(rows) = &tr.group_rows[variant.group] else {
                continue;
            };
            let np = tr.place_next[p][vi];
            // np は同列の下側の行、または次列の先頭
            let post: &[f64] = if np >= (col + 1) * GameState::HEIGHT {
                next_top
            } else {
                &rest[np - col * GameState::HEIGHT - row - 1]
            };
            let table = &tr.place_tables[p][vi];

            for (a, &s) in rows.sel.iter().enumerate() {
                let up_c = rows.up[a];
                for &(valid_w, new_w) in table {
                    let v = post[up_c * W_STATE_COUNT + new_w];
                    if v != 0.0 {
                        cur[s * W_STATE_COUNT + valid_w] += v;
                    }
                }
            }
        }
    }
}

pub fn calc_probabilities_exact(state: &GameState) -> Result<Vec<Map2d<f64>>> {
    let counts: [usize; GameState::ITEM_GROUP_COUNT] = [
        state.remaining_items[0].count,
        state.remaining_items[1].count,
        state.remaining_items[2].count,
    ];
    let cn: [usize; GameState::ITEM_GROUP_COUNT] =
        [counts[0] + 1, counts[1] + 1, counts[2] + 1];
    let c_total = cn[0] * cn[1] * cn[2];
    let strides: [usize; GameState::ITEM_GROUP_COUNT] = [cn[1] * cn[2], cn[2], 1];
    let full_c = c_total - 1;
    let layer_len = c_total * W_STATE_COUNT;

    // ---- 変異テーブル ----
    let mut variants: Vec<Variant> = vec![];
    for group in 0..GameState::ITEM_GROUP_COUNT {
        if counts[group] == 0 {
            continue;
        }
        let item = state.remaining_items[group].item;
        variants.push(Variant {
            group,
            height: item.height(),
            width: item.width(),
        });
        if item.height() != item.width() {
            variants.push(Variant {
                group,
                height: item.width(),
                width: item.height(),
            });
        }
    }

    // geom[p][vi]: 位置 p を左上として変異 vi を置けるか。
    let mut geom: Vec<Vec<bool>> = vec![vec![false; variants.len()]; POS_COUNT];
    // place_tables[p][vi]: (valid_w, new_w) の対。
    let mut place_tables: Vec<Vec<PlaceTable>> = vec![vec![vec![]; variants.len()]; POS_COUNT];
    // place_next[p][vi]: 配置後の注目位置（p より大きい）。
    let mut place_next: Vec<Vec<usize>> = vec![vec![0; variants.len()]; POS_COUNT];

    for p in 0..POS_COUNT {
        let row = p % GameState::HEIGHT;
        let col = p / GameState::HEIGHT;

        for (vi, variant) in variants.iter().enumerate() {
            let c0 = Coord::new(row, col);
            let c1 = Coord::new(row + variant.height, col + variant.width);

            if c1.row > GameState::HEIGHT || c1.col > GameState::WIDTH {
                continue;
            }
            if state.has_occupied(c0, c1) || state.has_vacant(c0, c1) {
                continue;
            }

            geom[p][vi] = true;
            place_next[p][vi] = place_next_pos(p, variant.height);

            // 覆われる行の wi がすべて 0 の w だけが遷移元になれる。
            let fill = variant.width - 1;
            let mut table = PlaceTable::new();
            for w in 0..W_STATE_COUNT {
                let mut ok = true;
                for r in row..row + variant.height {
                    if (w >> (r * W_BITS_PER_ROW)) & W_MASK as usize != 0 {
                        ok = false;
                        break;
                    }
                }
                if !ok {
                    continue;
                }
                let mut next = w;
                for r in row..row + variant.height {
                    next |= fill << (r * W_BITS_PER_ROW);
                }
                table.push((w as usize, next as usize));
            }
            place_tables[p][vi] = table;
        }
    }

    // ---- c 行の再映射（グループ i を置くと c_i が +1） ----
    let mut group_rows: Vec<Option<GroupRows>> =
        (0..GameState::ITEM_GROUP_COUNT).map(|_| None).collect();
    for group in 0..GameState::ITEM_GROUP_COUNT {
        if counts[group] == 0 {
            continue;
        }
        let mut sel = vec![];
        let mut up = vec![];
        for c in 0..c_total {
            let c0 = c / strides[0];
            let c1 = (c / strides[1]) % cn[1];
            let c2 = c % strides[1];
            let cv = [c0, c1, c2];
            if cv[group] < counts[group] {
                let mut next = cv;
                next[group] += 1;
                sel.push(c);
                up.push(next[0] * strides[0] + next[1] * strides[1] + next[2]);
            }
        }
        group_rows[group] = Some(GroupRows { sel, up });
    }

    let tr = Transition {
        variants,
        geom,
        place_next,
        place_tables,
        group_rows,
        c_total,
    };

    // ---- suf（後置DP）: 列先頭ベクトルだけをチェックポイントとして保持 ----
    // checkpoints[c] = suf[c * HEIGHT]（c = WIDTH は終端）。
    let mut checkpoints: Vec<Vec<f64>> = vec![vec![0.0; layer_len]; GameState::WIDTH + 1];
    checkpoints[GameState::WIDTH][full_c * W_STATE_COUNT] = 1.0;
    let mut col_suf: Vec<Vec<f64>> = vec![vec![0.0; layer_len]; GameState::HEIGHT];

    for col in (0..GameState::WIDTH).rev() {
        compute_column_suf(col, &checkpoints[col + 1], &mut col_suf, &tr);
        checkpoints[col].copy_from_slice(&col_suf[0]);
    }

    let all_count = checkpoints[0][0];
    ensure!(all_count > 0.0, "no_valid_configuration");

    // ---- pref（前置DP）+ 数え上げを1つの前進スイープで行う ----
    // pref[(col, 0)] は前列の next_top 累積だけで確定し、pref[(col, r>0)] は
    // 同列の上側の行からの伝播だけで確定する。したがって現在列の5層と
    // 次列先頭への累積1層だけで、pref を保存せずに数え上げられる。
    let mut counts_cell: Vec<Vec<f64>> = vec![vec![0.0; POS_COUNT]; GameState::ITEM_GROUP_COUNT];

    // col_pref[r] = pref[col*HEIGHT + r]。列の先頭は前列の累積から始まる。
    let mut col_pref: Vec<Vec<f64>> = vec![vec![0.0; layer_len]; GameState::HEIGHT];
    col_pref[0][0] = 1.0;
    // 次列の先頭位置 (col+1)*HEIGHT への書き込みの累積
    let mut next_top: Vec<f64> = vec![0.0; layer_len];

    for col in 0..GameState::WIDTH {
        // この列の suf をチェックポイントから再構築する
        compute_column_suf(col, &checkpoints[col + 1], &mut col_suf, &tr);

        for row in 0..GameState::HEIGHT {
            let p = col * GameState::HEIGHT + row;
            let (_, tail) = col_pref.split_at_mut(row);
            let (pref_p, rest) = tail.split_first_mut().expect("col_pref has HEIGHT rows");

            if pref_p.iter().all(|&v| v == 0.0) {
                continue;
            }

            // ---- 数え上げ: この位置に置く変異ごとに pref × suf ----
            for (vi, variant) in tr.variants.iter().enumerate() {
                if !tr.geom[p][vi] {
                    continue;
                }
                let Some(rows) = &tr.group_rows[variant.group] else {
                    continue;
                };
                let np = tr.place_next[p][vi];
                let post: &[f64] = if np >= (col + 1) * GameState::HEIGHT {
                    &checkpoints[col + 1]
                } else {
                    &col_suf[np - col * GameState::HEIGHT]
                };
                let table = &tr.place_tables[p][vi];

                let mut contain = 0.0f64;
                for (a, &s) in rows.sel.iter().enumerate() {
                    let up_base = rows.up[a] * W_STATE_COUNT;
                    let src_base = s * W_STATE_COUNT;
                    for &(valid_w, new_w) in table {
                        let pv = pref_p[src_base + valid_w];
                        if pv == 0.0 {
                            continue;
                        }
                        contain += pv * post[up_base + new_w];
                    }
                }

                if contain <= 0.0 {
                    continue;
                }

                for r in row..row + variant.height {
                    for c in col..col + variant.width {
                        counts_cell[variant.group][r * GameState::WIDTH + c] += contain;
                    }
                }
            }

            // ---- pref の伝播 ----
            // skip: pref[p+1][c][dec_w(w,row)] += pref[p][c][w]
            // （最下段は次列の先頭 next_top へ）
            {
                let skip_dst: &mut Vec<f64> = if row + 1 < GameState::HEIGHT {
                    &mut rest[0]
                } else {
                    &mut next_top
                };
                for c in 0..c_total {
                    let base = c * W_STATE_COUNT;
                    for w in 0..W_STATE_COUNT {
                        let v = pref_p[base + w];
                        if v != 0.0 {
                            skip_dst[base + dec_w(w as WBits, row) as usize] += v;
                        }
                    }
                }
            }

            // place: pref[np][up][new_w] += pref[p][sel][valid_w]
            for (vi, variant) in tr.variants.iter().enumerate() {
                if !tr.geom[p][vi] {
                    continue;
                }
                let Some(rows) = &tr.group_rows[variant.group] else {
                    continue;
                };
                let np = tr.place_next[p][vi];
                let dst: &mut Vec<f64> = if np >= (col + 1) * GameState::HEIGHT {
                    &mut next_top
                } else {
                    &mut rest[np - col * GameState::HEIGHT - row - 1]
                };
                let table = &tr.place_tables[p][vi];

                for (a, &s) in rows.sel.iter().enumerate() {
                    let up_c = rows.up[a];
                    for &(valid_w, new_w) in table {
                        let v = pref_p[s * W_STATE_COUNT + valid_w];
                        if v != 0.0 {
                            dst[up_c * W_STATE_COUNT + new_w] += v;
                        }
                    }
                }
            }
        }

        // 次列へ: 列先頭を next_top 累積で差し替え、下の4層は掃除する
        col_pref[0].copy_from_slice(&next_top);
        next_top.fill(0.0);
        for layer in col_pref.iter_mut().skip(1) {
            layer.fill(0.0);
        }
    }

    // flag = グループの部分集合ごとに、確率 = 覆われる盤面数 / 全盤面数。
    // 最初から置かれている備品はすべての盤面に含まれるので確率 1。
    let mut probabilities: Vec<Map2d<f64>> = vec![];

    for flag in 0..(1 << GameState::ITEM_GROUP_COUNT) {
        let mut prob = Map2d::new_with(0.0, GameState::WIDTH, GameState::HEIGHT);

        for placed in state.placed_items.iter() {
            if flag & (1 << placed.item.item_index()) == 0 {
                continue;
            }
            let r1 = placed.coord.row + placed.item.height();
            let c1 = placed.coord.col + placed.item.width();
            for row in placed.coord.row..r1 {
                for col in placed.coord.col..c1 {
                    prob[Coord::new(row, col)] += all_count;
                }
            }
        }

        for group in 0..GameState::ITEM_GROUP_COUNT {
            if flag & (1 << group) == 0 {
                continue;
            }
            for row in 0..GameState::HEIGHT {
                for col in 0..GameState::WIDTH {
                    let idx = row * GameState::WIDTH + col;
                    prob[Coord::new(row, col)] += counts_cell[group][idx];
                }
            }
        }

        for row in 0..GameState::HEIGHT {
            for col in 0..GameState::WIDTH {
                prob[Coord::new(row, col)] /= all_count;
            }
        }

        probabilities.push(prob);
    }

    Ok(probabilities)
}


use crate::{
    grid::{Coord, Map2d},
    mat,
    problem::{GameState, Item},
};
use anyhow::{ensure, Result};
use itertools::iproduct;
use rand::prelude::*;
use rand_pcg::Pcg64Mcg;
use std::array;

/// 各行の「先に何マス埋まっているか(wi: 0..=3)」を2bitずつ詰めた状態。
/// 5行ぶんで合計10bitを使うので、格納型はu16で十分。
type WBits = u16;
/// 1行あたりに割り当てるビット数。wiは0..=3なので2bit。
const W_BITS_PER_ROW: usize = 2;
/// 1行ぶんの値を取り出すためのマスク(0b11)。
const W_MASK: WBits = (1 << W_BITS_PER_ROW) - 1;
/// w_bits の全状態数。2bit x 5行 = 10bit なので 2^10 = 1024。
const W_STATE_COUNT: usize = 1 << (GameState::HEIGHT * W_BITS_PER_ROW);

/// w_bits から row 行目の wi(0..=3) を取り出す。
fn get_w(w_bits: WBits, row: usize) -> usize {
    ((w_bits >> (row * W_BITS_PER_ROW)) & W_MASK) as usize
}

/// w_bits の row 行目だけを value(0..=3) で上書きする。
fn set_w(w_bits: WBits, row: usize, value: usize) -> WBits {
    debug_assert!(value <= W_MASK as usize);
    let shift = row * W_BITS_PER_ROW;
    let clear_mask = !(W_MASK << shift);
    (w_bits & clear_mask) | ((value as WBits) << shift)
}

/// row 行目の wi を 1 減らす（0 未満にはしない）。
fn dec_w(w_bits: WBits, row: usize) -> WBits {
    set_w(w_bits, row, get_w(w_bits, row).saturating_sub(1))
}

/// 現在の注目位置(row, col)に item を置けるなら、影響した行の wi を更新した
/// 新しい w_bits を返す。どこかの行ですでに埋まりがあるなら None を返す。
fn fill_w_if_placeable(w_bits: WBits, row: usize, item: Item) -> Option<WBits> {
    let mut next = w_bits;
    let fill = item.width() - 1;

    for r in row..row + item.height() {
        if get_w(next, r) != 0 {
            return None;
        }
        next = set_w(next, r, fill);
    }

    Some(next)
}

/// 3アイテムについて、各マスにアイテムが置かれる確率を計算する。
pub fn calc_probabilities_all(state: &GameState, sample_count: u64) -> Result<Vec<Map2d<f64>>> {
    let mut rng = Pcg64Mcg::from_entropy();
    let sampled = sample_placements(state, sample_count, &mut rng);

    ensure!(sampled.all_count > 0, "no_valid_configuration");

    let mut probabilities = vec![];

    // 各アイテムについて、アイテムを置いた回数をカウントする
    for flag in 0..(1 << GameState::ITEM_GROUP_COUNT) {
        let prob = calc_probabilities(
            state,
            flag,
            sampled.sampled_count,
            &sampled.sampled_item_counts,
        );
        probabilities.push(prob);
    }

    Ok(probabilities)
}

pub fn calc_probabilities(
    state: &GameState,
    flag: u32,
    sampled_count: u64,
    sampled_item_counts: &[Map2d<u64>],
) -> Map2d<f64> {
    let mut counts = Map2d::new_with(0u64, GameState::WIDTH, GameState::HEIGHT);

    // 最初から置かれているもの
    for placements in state.placed_items.iter() {
        if flag & (1 << placements.item.item_index()) == 0 {
            continue;
        }

        let r0 = placements.coord.row;
        let c0 = placements.coord.col;
        let r1 = r0 + placements.item.height();
        let c1 = c0 + placements.item.width();

        for row in r0..r1 {
            for col in c0..c1 {
                counts[Coord::new(row, col)] += sampled_count;
            }
        }
    }

    for (item_index, item_counts) in sampled_item_counts
        .iter()
        .enumerate()
        .take(GameState::ITEM_GROUP_COUNT)
    {
        if flag & (1 << item_index) == 0 {
            continue;
        }

        for row in 0..GameState::HEIGHT {
            for col in 0..GameState::WIDTH {
                let coord = Coord::new(row, col);
                counts[coord] += item_counts[coord];
            }
        }
    }

    let mut prob = Map2d::new_with(0.0, GameState::WIDTH, GameState::HEIGHT);

    for row in 0..GameState::HEIGHT {
        for col in 0..GameState::WIDTH {
            prob[Coord::new(row, col)] = counts[Coord::new(row, col)] as f64 / sampled_count as f64;
        }
    }
    prob
}

/// `item_index x rotated(0/1) x (row, col)` の左上配置出現回数。
/// 復元中はこの頻度だけを集計し、最後に盤面セル占有カウントへ一括展開する。
struct TopLeftCounts {
    counts: Vec<[Map2d<u64>; 2]>,
}

impl TopLeftCounts {
    fn new() -> Self {
        let counts = (0..GameState::ITEM_GROUP_COUNT)
            .map(|_| {
                [
                    Map2d::new_with(0u64, GameState::WIDTH, GameState::HEIGHT),
                    Map2d::new_with(0u64, GameState::WIDTH, GameState::HEIGHT),
                ]
            })
            .collect();
        Self { counts }
    }

    fn add(&mut self, placement: &Placement, weight: u64) {
        let rotate_idx = if placement.is_rotated { 1 } else { 0 };
        self.counts[placement.item_index][rotate_idx][placement.coord] += weight;
    }

    fn to_item_counts(&self, state: &GameState) -> Vec<Map2d<u64>> {
        let mut sampled_item_counts =
            vec![
                Map2d::new_with(0u64, GameState::WIDTH, GameState::HEIGHT);
                GameState::ITEM_GROUP_COUNT
            ];

        for (item_index, item_counts) in sampled_item_counts
            .iter_mut()
            .enumerate()
            .take(GameState::ITEM_GROUP_COUNT)
        {
            for rotate_idx in 0..2 {
                let item = state.remaining_items[item_index].item;
                let item = if rotate_idx == 1 {
                    item.rotate().unwrap_or(item)
                } else {
                    item
                };

                for row in 0..GameState::HEIGHT {
                    for col in 0..GameState::WIDTH {
                        let coord = Coord::new(row, col);
                        let count = self.counts[item_index][rotate_idx][coord];
                        if count == 0 {
                            continue;
                        }

                        let r1 = row + item.height();
                        let c1 = col + item.width();
                        for r in row..r1 {
                            for c in col..c1 {
                                item_counts[Coord::new(r, c)] += count;
                            }
                        }
                    }
                }
            }
        }

        sampled_item_counts
    }
}

pub fn sample_placements(
    state: &GameState,
    sample_count: u64,
    rng: &mut impl Rng,
) -> SamplePlacementsResult {
    // DPにより候補数を計算する。
    //
    // 元の定義は次の10次元状態:
    //   dp[col][row][cnt0][cnt1][cnt2][w0][w1][w2][w3][w4]
    // ここで wi は「i 行目がこの先何列ぶん埋まっているか(0..=3)」を表す。
    //
    // GameState::MAX_ITEM_SIZE=4 固定のため wi は2bitで表せるので、
    // [w0..w4] を 2bit x 5行 = 10bit の w_bits にパックして次に畳み込んでいる:
    //   dp[col][row][cnt0][cnt1][cnt2][w_bits]
    //   w_bits = (w0 << 0) | (w1 << 2) | (w2 << 4) | (w3 << 6) | (w4 << 8)
    //
    // これにより状態数は 4^5 (= 1024) の1軸となり、配列次元を削減できる。
    // 最終的な答えは dp[WIDTH][0][C0][C1][C2][0]。
    let dp_cell = [0; W_STATE_COUNT];
    let mut dp = mat![dp_cell;
        GameState::WIDTH + 1;
        GameState::HEIGHT + 1;
        state.remaining_items[0].count + 1;
        state.remaining_items[1].count + 1;
        state.remaining_items[2].count + 1
    ];
    let from_cell: [Vec<_>; W_STATE_COUNT] = array::from_fn(|_| Vec::new());
    let mut from = mat![from_cell;
        GameState::WIDTH + 1;
        GameState::HEIGHT + 1;
        state.remaining_items[0].count + 1;
        state.remaining_items[1].count + 1;
        state.remaining_items[2].count + 1
    ];
    dp[0][0][0][0][0][0] = 1;

    // 6次元DP
    let product = iproduct!(
        0..GameState::WIDTH,
        0..GameState::HEIGHT,
        0..=state.remaining_items[0].count,
        0..=state.remaining_items[1].count,
        0..=state.remaining_items[2].count,
        0..W_STATE_COUNT
    );

    for (col, row, cnt0, cnt1, cnt2, w_bits_idx) in product {
        let cnts = [cnt0, cnt1, cnt2];
        let w_bits = w_bits_idx as WBits;
        let current_dp = dp[col][row][cnt0][cnt1][cnt2][w_bits_idx];

        if current_dp == 0 {
            continue;
        }

        // 次の状態への遷移関数
        let mut transit = |new_cnts: &[usize; 3], item: Item, item_i: usize, rotate: bool| {
            let coord = Coord::new(row, col);

            // 置けるかどうかチェック
            let bottom_right = item.bottom_right(coord);

            if bottom_right.row > GameState::HEIGHT || bottom_right.col > GameState::WIDTH {
                return;
            }

            if state.has_occupied(coord, bottom_right) || state.has_vacant(coord, bottom_right) {
                return;
            }

            let Some(new_w_bits) = fill_w_if_placeable(w_bits, row, item) else {
                return;
            };

            let (new_row, new_col) = if row + item.height() == GameState::HEIGHT {
                (0, col + 1)
            } else {
                (row + item.height(), col)
            };

            dp[new_col][new_row][new_cnts[0]][new_cnts[1]][new_cnts[2]][new_w_bits as usize] +=
                current_dp;
            from[new_col][new_row][new_cnts[0]][new_cnts[1]][new_cnts[2]][new_w_bits as usize]
                .push(History::new(
                    row,
                    col,
                    cnts,
                    w_bits,
                    Some((item_i as u8, rotate)),
                    current_dp,
                ));
        };

        // 新たにアイテムを置く遷移
        for i in 0..GameState::ITEM_GROUP_COUNT {
            if cnts[i] + 1 > state.remaining_items[i].count {
                continue;
            }

            let mut next_cnt = cnts;
            next_cnt[i] += 1;

            transit(&next_cnt, state.remaining_items[i].item, i, false);

            if let Some(rotated_item) = state.remaining_items[i].item.rotate() {
                transit(&next_cnt, rotated_item, i, true);
            }
        }

        // アイテムを置かずに着目するマスを次の位置に移動する遷移
        if row + 1 < GameState::HEIGHT {
            // 次の行に移動する
            let new_w_bits = dec_w(w_bits, row);

            dp[col][row + 1][cnt0][cnt1][cnt2][new_w_bits as usize] += current_dp;
            from[col][row + 1][cnt0][cnt1][cnt2][new_w_bits as usize]
                .push(History::new(row, col, cnts, w_bits, None, current_dp));
        } else if col < GameState::WIDTH {
            // 次の列に移動する
            let new_w_bits = dec_w(w_bits, row);

            dp[col + 1][0][cnt0][cnt1][cnt2][new_w_bits as usize] += current_dp;
            from[col + 1][0][cnt0][cnt1][cnt2][new_w_bits as usize]
                .push(History::new(row, col, cnts, w_bits, None, current_dp));
        }
    }

    let all_count = dp[GameState::WIDTH][0][state.remaining_items[0].count]
        [state.remaining_items[1].count][state.remaining_items[2].count][0];

    let (sampled_count, top_left_counts) = if all_count <= sample_count {
        let mut top_left_counts = TopLeftCounts::new();
        let cnt = [
            state.remaining_items[0].count,
            state.remaining_items[1].count,
            state.remaining_items[2].count,
        ];
        let sampled_count = restore_dfs(&from, 0, GameState::WIDTH, cnt, 0, &mut top_left_counts);
        (sampled_count, top_left_counts)
    } else {
        let top_left_counts = restore_random(state, &dp, &from, sample_count, rng);
        (sample_count, top_left_counts)
    };
    let sampled_item_counts = top_left_counts.to_item_counts(state);

    SamplePlacementsResult {
        all_count,
        sampled_count,
        sampled_item_counts,
    }
}

pub struct SamplePlacementsResult {
    pub all_count: u64,
    pub sampled_count: u64,
    pub sampled_item_counts: Vec<Map2d<u64>>,
}

type DP = Vec<Vec<Vec<Vec<Vec<[u64; W_STATE_COUNT]>>>>>;

type From = Vec<Vec<Vec<Vec<Vec<[Vec<History>; W_STATE_COUNT]>>>>>;

/// DFSで全ての解を復元する
fn restore_dfs(
    from: &From,
    row: usize,
    col: usize,
    cnt: [usize; GameState::ITEM_GROUP_COUNT],
    w_bits: usize,
    top_left_counts: &mut TopLeftCounts,
) -> u64 {
    if col == 0 && row == 0 {
        return 1;
    }

    let mut sampled_count = 0u64;
    for history in from[col][row][cnt[0]][cnt[1]][cnt[2]][w_bits].iter() {
        let prev = history.prev_state();

        let child_count = restore_dfs(
            from,
            prev.row,
            prev.col,
            prev.cnt,
            prev.w_bits,
            top_left_counts,
        );

        sampled_count += child_count;

        if let Some((item_i, rotate)) = history.item {
            let placement = Placement::new(history.coord(), item_i as usize, rotate);
            top_left_counts.add(&placement, child_count);
        }
    }
    sampled_count
}

/// ランダムサンプリングで解を復元する
fn restore_random(
    state: &GameState,
    dp: &DP,
    from: &From,
    sample_count: u64,
    rng: &mut impl Rng,
) -> TopLeftCounts {
    let mut top_left_counts = TopLeftCounts::new();

    if dp[GameState::WIDTH][0][state.remaining_items[0].count][state.remaining_items[1].count]
        [state.remaining_items[2].count][0]
        == 0
    {
        return top_left_counts;
    }

    for _ in 0..sample_count {
        let mut row = 0;
        let mut col = GameState::WIDTH;
        let mut cnt = [
            state.remaining_items[0].count,
            state.remaining_items[1].count,
            state.remaining_items[2].count,
        ];
        let mut w_bits = 0;

        while row > 0 || col > 0 {
            // 場合の数に比例した確率で次の状態を選択
            let histories = &from[col][row][cnt[0]][cnt[1]][cnt[2]][w_bits];
            let total = dp[col][row][cnt[0]][cnt[1]][cnt[2]][w_bits];
            let mut pick = rng.gen_range(0..total);
            let mut history = &histories[0];

            for h in histories.iter() {
                if pick < h.weight {
                    history = h;
                    break;
                }
                pick -= h.weight;
            }

            if let Some((item_i, rotate)) = history.item {
                let placement = Placement::new(history.coord(), item_i as usize, rotate);
                top_left_counts.add(&placement, 1);
            }
            let prev = history.prev_state();

            row = prev.row;
            col = prev.col;
            cnt = prev.cnt;
            w_bits = prev.w_bits;
        }
    }

    top_left_counts
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Placement {
    pub coord: Coord,
    pub item_index: usize,
    pub is_rotated: bool,
}

impl Placement {
    pub fn new(coord: Coord, item_index: usize, is_rotated: bool) -> Self {
        Self {
            coord,
            item_index,
            is_rotated,
        }
    }
}

#[derive(Debug, Clone, Copy)]
// DP復元用の逆遷移1本分。メモリ削減のため状態はu8で圧縮して保持する。
struct History {
    row: u8,
    col: u8,
    cnt: [u8; GameState::ITEM_GROUP_COUNT],
    w_bits: WBits,
    item: Option<(u8, bool)>,
    weight: u64,
}

#[derive(Debug, Clone, Copy)]
// 復元処理で扱いやすいusize表現の直前状態。
struct RestoreState {
    row: usize,
    col: usize,
    cnt: [usize; GameState::ITEM_GROUP_COUNT],
    w_bits: usize,
}

impl History {
    fn new(
        row: usize,
        col: usize,
        cnt: [usize; 3],
        w_bits: WBits,
        item: Option<(u8, bool)>,
        weight: u64,
    ) -> Self {
        debug_assert!(u8::try_from(row).is_ok());
        debug_assert!(u8::try_from(col).is_ok());
        debug_assert!(cnt.iter().all(|&v| u8::try_from(v).is_ok()));
        debug_assert!((w_bits as usize) < W_STATE_COUNT);
        debug_assert!(item.map(|(i, _)| i as usize).unwrap_or(0) < GameState::ITEM_GROUP_COUNT);

        Self {
            row: row as u8,
            col: col as u8,
            cnt: cnt.map(|v| v as u8),
            w_bits,
            item,
            weight,
        }
    }

    fn coord(&self) -> Coord {
        Coord::new(self.row as usize, self.col as usize)
    }

    fn prev_state(&self) -> RestoreState {
        RestoreState {
            row: self.row as usize,
            col: self.col as usize,
            cnt: self.cnt.map(|v| v as usize),
            w_bits: self.w_bits as usize,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        grid::Map2d,
        problem::{Item, ItemGroup},
    };

    fn calc_count(state: &GameState) -> u64 {
        let mut rng = Pcg64Mcg::from_entropy();
        sample_placements(state, 10000, &mut rng).all_count
    }

    #[test]
    fn test_calc_count() {
        let open_map = Map2d::new_with(false, GameState::WIDTH, GameState::HEIGHT);

        let remaining_items = [
            ItemGroup::new(Item::new(3, 2, 0), 1),
            ItemGroup::new(Item::new(1, 3, 1), 3),
            ItemGroup::new(Item::new(2, 1, 2), 5),
        ];
        let placed_items = vec![];

        let state = GameState::new(open_map, remaining_items, placed_items);

        assert_eq!(calc_count(&state), 93072764854);
    }

    #[test]
    fn test_calc_count_with_vacant() {
        let mut open_map = Map2d::new_with(false, GameState::WIDTH, GameState::HEIGHT);
        open_map[Coord::new(2, 1)] = true;

        let remaining_items = [
            ItemGroup::new(Item::new(3, 2, 0), 1),
            ItemGroup::new(Item::new(1, 3, 1), 3),
            ItemGroup::new(Item::new(2, 1, 2), 5),
        ];
        let placed_items = vec![];

        let state = GameState::new(open_map, remaining_items, placed_items);

        assert_eq!(calc_count(&state), 35318372443);
    }
}

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

/// 3アイテムについて、各マスにアイテムが置かれる確率を計算する。
pub fn calc_probabilities_all(state: &GameState, sample_count: usize) -> Result<Vec<Map2d<f64>>> {
    let mut rng = Pcg64Mcg::from_entropy();
    let (all_count, placements) = sample_placements(state, sample_count, &mut rng);

    ensure!(all_count > 0, "no_valid_configuration");

    let mut probabilities = vec![];

    // 各アイテムについて、アイテムを置いた回数をカウントする
    for flag in 0..(1 << GameState::ITEM_GROUP_COUNT) {
        let prob = calc_probabilities(state, flag, &placements);
        probabilities.push(prob);
    }

    Ok(probabilities)
}

pub fn calc_probabilities(
    state: &GameState,
    flag: u32,
    placements: &Vec<Vec<Placement>>,
) -> Map2d<f64> {
    let sampled_count = placements.len();
    let mut counts = Map2d::new_with(0, GameState::WIDTH, GameState::HEIGHT);

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

    // サンプリングされた配置
    for placements in placements.iter() {
        for placement in placements.iter() {
            if flag & (1 << placement.item_index) == 0 {
                continue;
            }

            let item = state.remaining_items[placement.item_index].item;

            let item = if placement.is_rotated {
                item.rotate().unwrap_or(item)
            } else {
                item
            };

            let r0 = placement.coord.row;
            let c0 = placement.coord.col;
            let r1 = r0 + item.height();
            let c1 = c0 + item.width();

            for row in r0..r1 {
                for col in c0..c1 {
                    counts[Coord::new(row, col)] += 1;
                }
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

pub fn sample_placements(
    state: &GameState,
    sample_count: usize,
    rng: &mut impl Rng,
) -> (u64, Vec<Vec<Placement>>) {
    // DPにより候補数を計算する
    //
    // dp[col][row][cnt0][cnt1][cnt2][w0][w1][w2][w3][w4]
    // (row, col)に着目していて、残りのアイテムがそれぞれcnt0, cnt1, cnt2個残っていて、
    // (0, 1, ... 4)行目がこの先(w0, w1, ..., w4)列分埋まっているときの場合の数
    // dp[WIDTH][0][C0][C1][C2][0][0][0][0][0]が答え
    let max_size = state
        .remaining_items
        .iter()
        .filter(|item| item.count > 0)
        .map(|item| item.item.height().max(item.item.width()))
        .max()
        .unwrap_or(1);
    let dp_cell = [[[[[0; GameState::MAX_ITEM_SIZE]; GameState::MAX_ITEM_SIZE];
        GameState::MAX_ITEM_SIZE]; GameState::MAX_ITEM_SIZE];
        GameState::MAX_ITEM_SIZE];
    let mut dp = mat![dp_cell;
        GameState::WIDTH + 1;
        GameState::HEIGHT + 1;
        state.remaining_items[0].count + 1;
        state.remaining_items[1].count + 1;
        state.remaining_items[2].count + 1
    ];
    let from_cell: [[[[[Vec<_>; GameState::MAX_ITEM_SIZE]; GameState::MAX_ITEM_SIZE];
        GameState::MAX_ITEM_SIZE]; GameState::MAX_ITEM_SIZE];
        GameState::MAX_ITEM_SIZE] = array::from_fn(|_| {
        array::from_fn(|_| array::from_fn(|_| array::from_fn(|_| array::from_fn(|_| Vec::new()))))
    });
    let mut from = mat![from_cell;
        GameState::WIDTH + 1;
        GameState::HEIGHT + 1;
        state.remaining_items[0].count + 1;
        state.remaining_items[1].count + 1;
        state.remaining_items[2].count + 1
    ];

    dp[0][0][0][0][0][0][0][0][0][0] = 1;

    // 10次元DP、地獄
    let product = iproduct!(
        0..GameState::WIDTH,
        0..GameState::HEIGHT,
        0..=state.remaining_items[0].count,
        0..=state.remaining_items[1].count,
        0..=state.remaining_items[2].count,
        0..max_size,
        0..max_size,
        0..max_size,
        0..max_size,
        0..max_size
    );

    for (col, row, cnt0, cnt1, cnt2, w0, w1, w2, w3, w4) in product {
        let cnts = [cnt0, cnt1, cnt2];
        let w = [w0, w1, w2, w3, w4];
        let current_dp = dp[col][row][cnt0][cnt1][cnt2][w0][w1][w2][w3][w4];

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

            let mut new_w = w.clone();

            for r in row..row + item.height() {
                if new_w[r] != 0 {
                    return;
                }

                new_w[r] = item.width() - 1;
            }

            let (new_row, new_col) = if row + item.height() == GameState::HEIGHT {
                (0, col + 1)
            } else {
                (row + item.height(), col)
            };

            dp[new_col][new_row][new_cnts[0]][new_cnts[1]][new_cnts[2]][new_w[0]][new_w[1]]
                [new_w[2]][new_w[3]][new_w[4]] += current_dp;
            from[new_col][new_row][new_cnts[0]][new_cnts[1]][new_cnts[2]][new_w[0]][new_w[1]]
                [new_w[2]][new_w[3]][new_w[4]]
                .push(History::new(row, col, cnts, w, Some((item_i, rotate))));
        };

        // 新たにアイテムを置く遷移
        for i in 0..GameState::ITEM_GROUP_COUNT {
            if cnts[i] + 1 > state.remaining_items[i].count {
                continue;
            }

            let mut next_cnt = cnts.clone();
            next_cnt[i] += 1;

            transit(&next_cnt, state.remaining_items[i].item, i, false);

            if let Some(rotated_item) = state.remaining_items[i].item.rotate() {
                transit(&next_cnt, rotated_item, i, true);
            }
        }

        // アイテムを置かずに着目するマスを次の位置に移動する遷移
        if row + 1 < GameState::HEIGHT {
            // 次の行に移動する
            let mut new_w = w.clone();
            new_w[row] = new_w[row].saturating_sub(1);

            dp[col][row + 1][cnt0][cnt1][cnt2][new_w[0]][new_w[1]][new_w[2]][new_w[3]][new_w[4]] +=
                current_dp;
            from[col][row + 1][cnt0][cnt1][cnt2][new_w[0]][new_w[1]][new_w[2]][new_w[3]][new_w[4]]
                .push(History::new(row, col, cnts, w, None));
        } else if col + 1 <= GameState::WIDTH {
            // 次の列に移動する
            let mut new_w = w.clone();
            new_w[row] = new_w[row].saturating_sub(1);

            dp[col + 1][0][cnt0][cnt1][cnt2][new_w[0]][new_w[1]][new_w[2]][new_w[3]][new_w[4]] +=
                current_dp;
            from[col + 1][0][cnt0][cnt1][cnt2][new_w[0]][new_w[1]][new_w[2]][new_w[3]][new_w[4]]
                .push(History::new(row, col, cnts, w, None));
        }
    }

    let all_count = dp[GameState::WIDTH][0][state.remaining_items[0].count]
        [state.remaining_items[1].count][state.remaining_items[2].count][0][0][0][0][0];

    let sampled_items = if all_count <= sample_count as u64 {
        let mut current_items = vec![];
        let mut all_items = vec![];
        let cnt = [
            state.remaining_items[0].count,
            state.remaining_items[1].count,
            state.remaining_items[2].count,
        ];
        let w = [0, 0, 0, 0, 0];
        restore_dfs(
            &from,
            0,
            GameState::WIDTH,
            cnt,
            w,
            &mut current_items,
            &mut all_items,
        );

        all_items
    } else {
        restore_random(state, &dp, &from, sample_count, rng)
    };

    (all_count, sampled_items)
}

type DP = Vec<
    Vec<
        Vec<
            Vec<
                Vec<
                    [[[[[u64; GameState::MAX_ITEM_SIZE]; GameState::MAX_ITEM_SIZE];
                        GameState::MAX_ITEM_SIZE]; GameState::MAX_ITEM_SIZE];
                        GameState::MAX_ITEM_SIZE],
                >,
            >,
        >,
    >,
>;

type From = Vec<
    Vec<
        Vec<
            Vec<
                Vec<
                    [[[[[Vec<History>; GameState::MAX_ITEM_SIZE]; GameState::MAX_ITEM_SIZE];
                        GameState::MAX_ITEM_SIZE]; GameState::MAX_ITEM_SIZE];
                        GameState::MAX_ITEM_SIZE],
                >,
            >,
        >,
    >,
>;

/// DFSで全ての解を復元する
fn restore_dfs(
    from: &From,
    row: usize,
    col: usize,
    cnt: [usize; GameState::ITEM_GROUP_COUNT],
    w: [usize; GameState::HEIGHT],
    current_placements: &mut Vec<Placement>,
    all_placements: &mut Vec<Vec<Placement>>,
) {
    if col == 0 && row == 0 {
        all_placements.push(current_placements.clone());
        return;
    }

    for history in from[col][row][cnt[0]][cnt[1]][cnt[2]][w[0]][w[1]][w[2]][w[3]][w[4]].iter() {
        if let Some((item_i, rotate)) = history.item {
            current_placements.push(Placement::new(
                Coord::new(history.row, history.col),
                item_i,
                rotate,
            ));
        }

        restore_dfs(
            from,
            history.row,
            history.col,
            history.cnt,
            history.w,
            current_placements,
            all_placements,
        );

        if history.item.is_some() {
            current_placements.pop();
        }
    }
}

/// ランダムサンプリングで解を復元する
fn restore_random(
    state: &GameState,
    dp: &DP,
    from: &From,
    sample_count: usize,
    rng: &mut impl Rng,
) -> Vec<Vec<Placement>> {
    let mut all_items = vec![];

    if dp[GameState::WIDTH][0][state.remaining_items[0].count][state.remaining_items[1].count]
        [state.remaining_items[2].count][0][0][0][0][0]
        == 0
    {
        return all_items;
    }

    for _ in 0..sample_count {
        let mut current_items = vec![];
        let mut row = 0;
        let mut col = GameState::WIDTH;
        let mut cnt = [
            state.remaining_items[0].count,
            state.remaining_items[1].count,
            state.remaining_items[2].count,
        ];
        let mut w = [0, 0, 0, 0, 0];

        while row > 0 || col > 0 {
            // 場合の数に比例した確率で次の状態を選択
            let histories = &from[col][row][cnt[0]][cnt[1]][cnt[2]][w[0]][w[1]][w[2]][w[3]][w[4]];
            let history = histories
                .choose_weighted(rng, |h| {
                    dp[h.col][h.row][h.cnt[0]][h.cnt[1]][h.cnt[2]][h.w[0]][h.w[1]][h.w[2]][h.w[3]]
                        [h.w[4]]
                })
                .expect("Histories is empty.");

            if let Some((item_i, rotate)) = history.item {
                current_items.push(Placement::new(
                    Coord::new(history.row, history.col),
                    item_i,
                    rotate,
                ));
            }

            row = history.row;
            col = history.col;
            cnt = history.cnt;
            w = history.w;
        }

        all_items.push(current_items);
    }

    all_items
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
struct History {
    row: usize,
    col: usize,
    cnt: [usize; 3],
    w: [usize; 5],
    item: Option<(usize, bool)>,
}

impl History {
    fn new(
        row: usize,
        col: usize,
        cnt: [usize; 3],
        w: [usize; 5],
        item: Option<(usize, bool)>,
    ) -> Self {
        Self {
            row,
            col,
            cnt,
            w,
            item,
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
        sample_placements(state, 10000, &mut rng).0
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

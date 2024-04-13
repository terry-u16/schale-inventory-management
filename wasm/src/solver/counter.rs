use crate::{
    grid::Coord,
    mat,
    problem::{GameState, Item},
};
use itertools::iproduct;

pub fn calc_count(state: &GameState) -> u64 {
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
        let mut transit = |cnt: &[usize; 3], item: Item| {
            let coord = Coord::new(row, col);

            // 置けるかどうかチェック
            let bottom_right = item.bottom_right(coord);

            if bottom_right.row > GameState::HEIGHT || bottom_right.col > GameState::WIDTH {
                return;
            }

            if state.has_occupied(coord, bottom_right) || state.has_vacant(coord, bottom_right) {
                return;
            }

            let mut w = w.clone();

            for r in row..row + item.height() {
                if w[r] != 0 {
                    return;
                }

                w[r] = item.width() - 1;
            }

            let (row, col) = if row + item.height() == GameState::HEIGHT {
                (0, col + 1)
            } else {
                (row + item.height(), col)
            };

            dp[col][row][cnt[0]][cnt[1]][cnt[2]][w[0]][w[1]][w[2]][w[3]][w[4]] += current_dp;
        };

        // 新たにアイテムを置く遷移
        for i in 0..GameState::ITEM_GROUP_COUNT {
            if cnts[i] + 1 > state.remaining_items[i].count {
                continue;
            }

            let mut next_cnt = cnts.clone();
            next_cnt[i] += 1;

            transit(&next_cnt, state.remaining_items[i].item);

            if let Some(item) = state.remaining_items[i].item.rotate() {
                transit(&next_cnt, item);
            }
        }

        // アイテムを置かずに着目するマスを次の位置に移動する遷移
        if row + 1 < GameState::HEIGHT {
            // 次の行に移動する
            let mut w = w.clone();
            w[row] = w[row].saturating_sub(1);

            dp[col][row + 1][cnt0][cnt1][cnt2][w[0]][w[1]][w[2]][w[3]][w[4]] += current_dp;
        } else if col + 1 <= GameState::WIDTH {
            // 次の列に移動する
            let mut w = w.clone();
            w[row] = w[row].saturating_sub(1);

            dp[col + 1][0][cnt0][cnt1][cnt2][w[0]][w[1]][w[2]][w[3]][w[4]] += current_dp;
        }
    }

    dp[GameState::WIDTH][0][state.remaining_items[0].count][state.remaining_items[1].count]
        [state.remaining_items[2].count][0][0][0][0][0]
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        grid::Map2d,
        problem::{Item, ItemGroup},
    };

    #[test]
    fn test_calc_count() {
        let open_map = Map2d::new_with(false, GameState::WIDTH, GameState::HEIGHT);

        let remaining_items = [
            ItemGroup::new(Item::new(3, 2), 1),
            ItemGroup::new(Item::new(1, 3), 3),
            ItemGroup::new(Item::new(2, 1), 5),
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
            ItemGroup::new(Item::new(3, 2), 1),
            ItemGroup::new(Item::new(1, 3), 3),
            ItemGroup::new(Item::new(2, 1), 5),
        ];
        let placed_items = vec![];

        let state = GameState::new(open_map, remaining_items, placed_items);

        assert_eq!(calc_count(&state), 35318372443);
    }
}

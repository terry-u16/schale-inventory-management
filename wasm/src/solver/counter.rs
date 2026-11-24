use crate::{
    grid::{Coord, Map2d},
    problem::{GameState, Item},
};
use anyhow::{ensure, Result};
use rand::prelude::*;
use std::collections::HashMap;

/// 各行の「先に何マス埋まっているか(wi: 0..=3)」を2bitずつ詰めた状態。
/// 5行ぶんで合計10bitを使うので、格納型はu16で十分。
type WBits = u16;
/// 1行あたりに割り当てるビット数。wiは0..=3なので2bit。
const W_BITS_PER_ROW: usize = 2;
/// 1行ぶんの値を取り出すためのマスク(0b11)。
const W_MASK: WBits = (1 << W_BITS_PER_ROW) - 1;
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
pub fn calc_probabilities_all(state: &GameState) -> Result<Vec<Map2d<f64>>> {
    let (total, item_counts) = count_placements(state)?;
    Ok((0..1 << GameState::ITEM_GROUP_COUNT)
        .map(|flag| calc_probabilities(state, flag, total, &item_counts))
        .collect())
}

pub fn calc_probabilities(
    state: &GameState,
    flag: u32,
    total: u64,
    occupancy_counts: &[Map2d<u64>],
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
                counts[Coord::new(row, col)] += total;
            }
        }
    }

    for (item_index, item_counts) in occupancy_counts
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
            prob[Coord::new(row, col)] = counts[Coord::new(row, col)] as f64 / total as f64;
        }
    }
    prob
}

/// `item_index x rotated(0/1) x (row, col)` の左上配置出現回数。
/// 配置遷移ごとに集計し、最後に各備品が占めるマスへ展開する。
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
        let mut occupancy_counts = vec![
            Map2d::new_with(0u64, GameState::WIDTH, GameState::HEIGHT);
            GameState::ITEM_GROUP_COUNT
        ];

        for (item_index, item_counts) in occupancy_counts
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

        occupancy_counts
    }
}

const CELL_COUNT: usize = GameState::HEIGHT * GameState::WIDTH;

// pos = col * HEIGHT + row の順に走査する。備品を置くと高さぶん進む。
#[derive(Clone, Copy, PartialEq, Eq, Hash)]
struct Frontier {
    remaining: [usize; GameState::ITEM_GROUP_COUNT],
    w_bits: WBits,
}

struct PlacementDp {
    initial: Frontier,
    candidates: Vec<Vec<(Placement, Item)>>,
    // suffix[pos][frontier]: この状態から全備品を置き切る配置数。
    // 配置数は u64 の範囲を超える場合があるが、issue #14 の方針に従いオーバーフローを許容する。
    // https://github.com/terry-u16/schale-inventory-management/issues/14
    suffix: Vec<HashMap<Frontier, u64>>,
}

impl PlacementDp {
    fn new(state: &GameState) -> Self {
        let mut candidates = vec![Vec::new(); CELL_COUNT];
        for (pos, options) in candidates.iter_mut().enumerate() {
            let coord = Coord::new(pos % GameState::HEIGHT, pos / GameState::HEIGHT);
            for (index, group) in state.remaining_items.iter().enumerate() {
                for (rotated, item) in [(false, Some(group.item)), (true, group.item.rotate())] {
                    let Some(item) = item else { continue };
                    let end = item.bottom_right(coord);
                    if end.row <= GameState::HEIGHT
                        && end.col <= GameState::WIDTH
                        && !state.has_occupied(coord, end)
                        && !state.has_vacant(coord, end)
                    {
                        options.push((Placement::new(coord, index, rotated), item));
                    }
                }
            }
        }
        let initial = Frontier {
            remaining: state.remaining_items.map(|group| group.count),
            w_bits: 0,
        };
        let mut suffix = vec![HashMap::new(); CELL_COUNT + 1];
        Self::count_suffix(&candidates, &mut suffix, 0, initial);
        Self {
            initial,
            candidates,
            suffix,
        }
    }

    fn transitions(
        options: &[(Placement, Item)],
        pos: usize,
        frontier: Frontier,
    ) -> impl Iterator<Item = (usize, Frontier, Option<Placement>)> + '_ {
        std::iter::once((pos + 1, frontier.skip(pos), None)).chain(options.iter().filter_map(
            move |&(placement, item)| {
                let next = frontier.place(placement, item)?;
                Some((pos + item.height(), next, Some(placement)))
            },
        ))
    }

    // 初期状態から到達する状態だけをメモ化する。
    fn count_suffix(
        candidates: &[Vec<(Placement, Item)>],
        suffix: &mut [HashMap<Frontier, u64>],
        pos: usize,
        frontier: Frontier,
    ) -> u64 {
        if let Some(&count) = suffix[pos].get(&frontier) {
            return count;
        }
        let count = if pos == CELL_COUNT {
            u64::from(
                frontier.remaining == [0; GameState::ITEM_GROUP_COUNT] && frontier.w_bits == 0,
            )
        } else {
            Self::transitions(&candidates[pos], pos, frontier)
                .map(|(end, next, _)| Self::count_suffix(candidates, suffix, end, next))
                .sum()
        };
        suffix[pos].insert(frontier, count);
        count
    }
}

impl Frontier {
    fn skip(mut self, pos: usize) -> Self {
        self.w_bits = dec_w(self.w_bits, pos % GameState::HEIGHT);
        self
    }

    fn place(mut self, placement: Placement, item: Item) -> Option<Self> {
        self.remaining[placement.item_index] =
            self.remaining[placement.item_index].checked_sub(1)?;
        self.w_bits = fill_w_if_placeable(self.w_bits, placement.coord.row, item)?;
        Some(self)
    }
}

pub fn count_placements(state: &GameState) -> Result<(u64, Vec<Map2d<u64>>)> {
    let dp = PlacementDp::new(state);
    let total = dp.suffix[0][&dp.initial];
    ensure!(total > 0, "no_valid_configuration");

    let mut prefix = vec![HashMap::new(); CELL_COUNT + 1];
    prefix[0].insert(dp.initial, 1u64);
    let mut top_left = TopLeftCounts::new();
    for pos in 0..CELL_COUNT {
        for (frontier, ways) in std::mem::take(&mut prefix[pos]) {
            for (end, next, placement) in
                PlacementDp::transitions(&dp.candidates[pos], pos, frontier)
            {
                let completions = dp.suffix[end][&next];
                if completions == 0 {
                    continue;
                }
                *prefix[end].entry(next).or_default() += ways;
                if let Some(placement) = placement {
                    // 遷移を通る全配置は、遷移前の配置と遷移後の完成方法の組に一対一対応する。
                    top_left.add(&placement, ways * completions);
                }
            }
        }
    }
    Ok((total, top_left.to_item_counts(state)))
}

pub fn sample_one_placement(state: &GameState, rng: &mut impl Rng) -> Result<Vec<Placement>> {
    let dp = PlacementDp::new(state);
    let mut frontier = dp.initial;
    let total = dp.suffix[0][&frontier];
    ensure!(total > 0, "no_valid_configuration");
    let mut rank = rng.gen_range(0..total);
    let mut placements = Vec::new();
    let mut pos = 0;
    while pos < CELL_COUNT {
        let (end, next, placement) = PlacementDp::transitions(&dp.candidates[pos], pos, frontier)
            .find(|&(end, next, _)| {
                let count = dp.suffix[end][&next];
                if rank < count {
                    return true;
                }
                rank -= count;
                false
            })
            .expect("rank lies within the completion count");
        placements.extend(placement);
        pos = end;
        frontier = next;
    }
    Ok(placements)
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        grid::Map2d,
        problem::{Item, ItemGroup},
    };

    fn calc_count(state: &GameState) -> u64 {
        count_placements(state).unwrap().0
    }

    #[test]
    fn exact_cell_counts_above_old_sampling_limit() {
        let state = GameState::new(
            Map2d::new_with(false, GameState::WIDTH, GameState::HEIGHT),
            [
                ItemGroup::new(Item::new(1, 1, 0), 4),
                ItemGroup::new(Item::new(1, 1, 1), 0),
                ItemGroup::new(Item::new(1, 1, 2), 0),
            ],
            vec![],
        );
        let (total, counts) = count_placements(&state).unwrap();
        // C(45, 4) 通りのうち、指定したマスを含むのは C(44, 3) 通り。
        assert_eq!(total, 148_995);
        assert!(counts[0].iter().all(|&n| n == 13_244));
    }

    #[test]
    fn exact_probabilities_with_rotation_and_placed_item() {
        use crate::problem::PlacedItem;

        let mut open = Map2d::new_with(true, GameState::WIDTH, GameState::HEIGHT);
        for coord in [Coord::new(0, 0), Coord::new(0, 1), Coord::new(1, 0)] {
            open[coord] = false;
        }
        let fixed = Item::new(1, 1, 1);
        let state = GameState::new(
            open,
            [
                ItemGroup::new(Item::new(1, 2, 0), 1),
                ItemGroup::new(fixed, 0),
                ItemGroup::new(Item::new(1, 1, 2), 0),
            ],
            vec![PlacedItem::new(fixed, Coord::new(1, 1))],
        );
        let probs = calc_probabilities_all(&state).unwrap();
        assert_eq!(probs[1][Coord::new(0, 0)], 1.0);
        assert_eq!(probs[1][Coord::new(0, 1)], 0.5);
        assert_eq!(probs[1][Coord::new(1, 0)], 0.5);
        assert_eq!(probs[1][Coord::new(1, 1)], 0.0);
        assert_eq!(probs[3][Coord::new(1, 1)], 1.0);
        assert_eq!(probs[3][Coord::new(2, 2)], 0.0);
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

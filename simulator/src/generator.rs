use itertools::Itertools;
use rand::Rng;
use wasm_solver::{
    grid::{Coord, Map2d},
    problem::{GameState, Item, ItemGroup, PlacedItem},
    solver::counter::{calc_probabilities, sample_placements},
};

#[derive(Debug, Clone)]
pub struct SimulationState {
    pub game_state: GameState,
    pub answer: Vec<PlacedItem>,
    pub answer_map: Map2d<Option<usize>>,
    pub found: Vec<bool>,
    pub open_count: usize,
}

impl SimulationState {
    pub fn generate(board_type: usize, rng: &mut impl Rng) -> Self {
        let game_state = GameState::new(
            Map2d::new_with(false, GameState::WIDTH, GameState::HEIGHT),
            Self::get_items(board_type),
            vec![],
        );

        let (_, sampled) = sample_placements(&game_state, 1, rng);
        let answer = sampled[0]
            .iter()
            .map(|placement| {
                let mut item = game_state.remaining_items[placement.item_index].item;
                let coord = placement.coord;

                if placement.is_rotated {
                    item = item.rotate().unwrap_or(item);
                }

                PlacedItem { item, coord }
            })
            .collect_vec();

        let mut answer_map = Map2d::new_with(None, GameState::WIDTH, GameState::HEIGHT);

        for (index, placed_item) in answer.iter().enumerate() {
            let r0 = placed_item.coord.row;
            let c0 = placed_item.coord.col;
            let r1 = r0 + placed_item.item.height();
            let c1 = c0 + placed_item.item.width();

            for row in r0..r1 {
                for col in c0..c1 {
                    answer_map[Coord::new(row, col)] = Some(index);
                }
            }
        }

        let open_count = 0;
        let found = vec![false; answer.len()];

        Self {
            game_state,
            answer,
            answer_map,
            open_count,
            found,
        }
    }

    pub fn open(&mut self, coord: Coord) -> Option<usize> {
        assert!(!self.game_state.open_map[coord]);

        self.game_state.open_map[coord] = true;
        self.open_count += 1;
        let index = self.answer_map[coord];

        if let Some(index) = index {
            if !self.found[index] {
                self.found[index] = true;
                self.game_state.remaining_items[self.answer[index].item.item_index()].count -= 1;
                self.game_state
                    .placed_items
                    .push(self.answer[index].clone());
            }
        }

        // 累積和の再計算が必要
        self.game_state = GameState::new(
            self.game_state.open_map.clone(),
            self.game_state.remaining_items,
            self.game_state.placed_items.clone(),
        );

        index
    }

    pub fn get_probs(&self, flag: u32, sample_count: usize, rng: &mut impl Rng) -> Map2d<f64> {
        let (_, placements) = sample_placements(&self.game_state, sample_count, rng);
        calc_probabilities(&self.game_state, flag, &placements)
    }

    fn get_items(board_type: usize) -> [ItemGroup; GameState::ITEM_GROUP_COUNT] {
        match board_type {
            0 => [
                ItemGroup::new(Item::new(2, 3, 0), 1),
                ItemGroup::new(Item::new(3, 1, 1), 3),
                ItemGroup::new(Item::new(1, 2, 2), 5),
            ],
            1 => [
                ItemGroup::new(Item::new(2, 4, 0), 1),
                ItemGroup::new(Item::new(2, 2, 1), 2),
                ItemGroup::new(Item::new(3, 1, 2), 3),
            ],
            2 => [
                ItemGroup::new(Item::new(3, 3, 0), 1),
                ItemGroup::new(Item::new(4, 1, 1), 2),
                ItemGroup::new(Item::new(1, 2, 2), 4),
            ],
            _ => panic!("Invalid board type: {}", board_type),
        }
    }
}

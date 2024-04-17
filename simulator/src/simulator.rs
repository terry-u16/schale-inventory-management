use itertools::Itertools;
use rand::prelude::*;
use rand::{Rng, SeedableRng};
use rand_pcg::Pcg64Mcg;
use rayon::iter::{IndexedParallelIterator, IntoParallelIterator, ParallelIterator};
use wasm_solver::{grid::Coord, problem::GameState};

use crate::generator::SimulationState;

pub fn simulate(
    board_type: usize,
    target_item: usize,
    game_sample_count: usize,
    prob_sample_count: usize,
) -> Vec<f64> {
    assert!(target_item < GameState::ITEM_GROUP_COUNT);
    let mut counts = vec![];

    (0..game_sample_count)
        .into_par_iter()
        .map(|_| {
            let mut rng = Pcg64Mcg::from_entropy();
            simulate_once(board_type, target_item, prob_sample_count, &mut rng)
        })
        .collect_into_vec(&mut counts);

    let mut probs_int = vec![0; GameState::HEIGHT * GameState::WIDTH + 1];

    for &count in &counts {
        probs_int[count] += 1;
    }

    probs_int
        .iter()
        .map(|&count| count as f64 / game_sample_count as f64)
        .collect()
}

fn simulate_once(
    board_type: usize,
    target_item: usize,
    prob_sample_count: usize,
    rng: &mut impl Rng,
) -> usize {
    let mut state = SimulationState::generate(board_type, rng);
    let target_items = (0..=target_item).collect_vec();
    let flag = (0..=target_item).fold(0, |acc, i| acc | 1 << i);

    while target_items
        .iter()
        .any(|&i| state.game_state.remaining_items[i].count > 0)
    {
        let probs = state.get_probs(flag, prob_sample_count, rng);

        let mut best_prob = 0.0;
        let mut best_pos = vec![];

        for row in 0..GameState::HEIGHT {
            for col in 0..GameState::WIDTH {
                let c = Coord::new(row, col);

                if !state.game_state.open_map[c] && best_prob < probs[c] {
                    if best_prob < probs[c] {
                        best_pos.clear();
                    }

                    if best_prob <= probs[c] {
                        best_prob = probs[c];
                        best_pos.push(c);
                    }
                }
            }
        }

        let best_pos = *best_pos.choose(rng).unwrap();
        let opened = state.open(best_pos);

        if let Some(item_index) = opened {
            let item = state.answer[item_index];

            if item.item.item_index() <= target_item {
                for row in item.coord.row..item.coord.row + item.item.height() {
                    for col in item.coord.col..item.coord.col + item.item.width() {
                        let c = Coord::new(row, col);

                        if c == best_pos {
                            continue;
                        }

                        state.open(c);
                    }
                }
            }
        }
    }

    state.open_count
}

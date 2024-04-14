pub mod grid;
pub mod problem;
pub mod solver;
mod utils;

use anyhow::{anyhow, bail, Result};
use grid::Coord;
use problem::GameState;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

use crate::{
    grid::Map2d,
    problem::{Item, ItemGroup},
    solver::counter,
};

#[derive(Deserialize, Clone)]
pub struct JsInput {
    pub item_and_placement: Vec<JsItemAndPlacement>,
    pub open_map: Vec<bool>,
}

#[derive(Deserialize, Clone)]
pub struct JsItemAndPlacement {
    pub item: JsItemSet,
    pub placements: Vec<JsPlacedItem>,
}

impl TryFrom<JsInput> for GameState {
    type Error = anyhow::Error;

    fn try_from(value: JsInput) -> Result<Self, Self::Error> {
        let open_map = Map2d::new(value.open_map, 9, 5);
        let mut remaining_items = [
            value.item_and_placement[0].item.clone(),
            value.item_and_placement[1].item.clone(),
            value.item_and_placement[2].item.clone(),
        ]
        .map(|item_set| {
            ItemGroup::new(
                Item::new(
                    item_set.item.height as usize,
                    item_set.item.width as usize,
                    item_set.item.index as usize,
                ),
                item_set.count as usize,
            )
        });

        let mut placed_items = vec![];

        for placed_item in value
            .item_and_placement
            .iter()
            .flat_map(|ip| ip.placements.iter())
        {
            let mut item = Item::new(
                placed_item.item.height as usize,
                placed_item.item.width as usize,
                placed_item.item.index as usize,
            );

            if placed_item.rotated {
                item = item.rotate();
            }

            remaining_items[item.item_index()].count -= 1;

            let item = problem::PlacedItem {
                item,
                coord: Coord::new(placed_item.row as usize - 1, placed_item.col as usize - 1),
            };

            placed_items.push(item);
        }

        // 重なっていないかチェック
        let mut overlap_map = Map2d::new_with(0u32, GameState::WIDTH, GameState::HEIGHT);
        let mut counts = [0; GameState::ITEM_GROUP_COUNT];
        let mut labels = vec![];

        for (i, placed) in placed_items.iter().enumerate() {
            counts[placed.item.item_index()] += 1;
            labels.push((placed.item.item_index(), counts[placed.item.item_index()]));

            let row0 = placed.coord.row;
            let col0 = placed.coord.col;
            let row1 = row0 + placed.item.height();
            let col1 = col0 + placed.item.width();

            for row in row0..row1 {
                for col in col0..col1 {
                    overlap_map[Coord::new(row, col)] |= 1 << i;
                }
            }
        }

        for row in 0..GameState::HEIGHT {
            for col in 0..GameState::WIDTH {
                let mut flag = overlap_map[Coord::new(row, col)];
                if flag.count_ones() > 1 {
                    let i = flag.trailing_zeros() as usize;
                    let (item0, index0) = labels[i];
                    flag ^= 1 << i;
                    let j = flag.trailing_zeros() as usize;
                    let (item1, index1) = labels[j];

                    return Err(anyhow!(
                        "アイテム{}の{}番目とアイテム{}の{}番目が座標({}, {})で重なっています。\nアイテムの初期位置が重ならないように修正してください。",
                        item0,
                        index0,
                        item1,
                        index1,
                        row,
                        col
                    ));
                }
            }
        }

        Ok(GameState::new(open_map, remaining_items, placed_items))
    }
}

#[derive(Deserialize, Clone)]
pub struct JsItemSet {
    pub item: JsItem,
    pub count: i32,
}

#[derive(Deserialize, Clone)]
pub struct JsItem {
    pub width: i32,
    pub height: i32,
    pub index: i32,
}

#[derive(Deserialize, Clone)]
pub struct JsPlacedItem {
    pub item: JsItem,
    pub rotated: bool,
    pub row: i32,
    pub col: i32,
    pub id: String,
}

#[derive(Serialize, Clone)]
pub struct ProbResult {
    pub probs: Vec<Vec<f64>>,
    pub error: String,
}

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn solve(input: JsValue) -> JsValue {
    match solve_inner(input) {
        Ok(result) => serde_wasm_bindgen::to_value(&ProbResult {
            probs: result,
            error: "".to_string(),
        })
        .unwrap(),
        Err(err) => serde_wasm_bindgen::to_value(&ProbResult {
            probs: vec![],
            error: err.to_string(),
        })
        .unwrap(),
    }
}

fn solve_inner(input: JsValue) -> anyhow::Result<Vec<Vec<f64>>> {
    let input = match serde_wasm_bindgen::from_value::<JsInput>(input) {
        Ok(input) => input,
        Err(_) => {
            bail!("入力の読み込み中にエラーが発生しました。")
        }
    };

    let game_state = GameState::try_from(input)?;

    let result = counter::calc_probabilities(&game_state, 10000)?;
    let result = result
        .iter()
        .map(|prob| prob.iter().copied().collect())
        .collect();

    Ok(result)
}

use num_traits::NumAssign;

use crate::grid::{Coord, Map2d};

/// 問題の状態。
#[derive(Debug, Clone)]
pub struct GameState {
    pub open_map: Map2d<bool>,
    pub remaining_items: [ItemGroup; Self::ITEM_GROUP_COUNT],
    pub placed_items: Vec<PlacedItem>,
    vacant: PrefixSumMap2d<usize>,
    occupied: PrefixSumMap2d<usize>,
}

impl GameState {
    pub const WIDTH: usize = 9;
    pub const HEIGHT: usize = 5;

    /// アイテムグループの数。1周にアイテムは3つとする。
    pub const ITEM_GROUP_COUNT: usize = 3;

    /// アイテムの最大サイズ。高さと幅がともに4以下である。
    pub const MAX_ITEM_SIZE: usize = 4;

    pub fn new(
        open_map: Map2d<bool>,
        remaining_items: [ItemGroup; Self::ITEM_GROUP_COUNT],
        placed_items: Vec<PlacedItem>,
    ) -> Self {
        let mut occupied = Map2d::new_with(0, Self::WIDTH, Self::HEIGHT);

        for placed_item in placed_items.iter() {
            let c0 = placed_item.coord;
            let c1 = Coord::new(
                c0.row + placed_item.item.height,
                c0.col + placed_item.item.width,
            );

            for row in c0.row..c1.row {
                for col in c0.col..c1.col {
                    occupied[Coord::new(row, col)] += 1;
                }
            }
        }

        let mut vacant = Map2d::new_with(0, Self::WIDTH, Self::HEIGHT);

        for row in 0..Self::HEIGHT {
            for col in 0..Self::WIDTH {
                let c = Coord::new(row, col);

                vacant[c] = (open_map[c] && occupied[c] == 0) as usize;
            }
        }

        let vacant = PrefixSumMap2d::new(&vacant);
        let occupied = PrefixSumMap2d::new(&occupied);

        Self {
            open_map,
            remaining_items,
            placed_items,
            vacant,
            occupied,
        }
    }

    /// [c0.row, c1.row) x [c0.col, c1.col) の範囲に確定空きマスがあるかどうかを返す。
    pub fn has_vacant(&self, c0: Coord, c1: Coord) -> bool {
        self.vacant.calc_sum(c0, c1) > 0
    }

    /// [c0.row, c1.row) x [c0.col, c1.col) の範囲に確定占有マスがあるかどうかを返す。
    pub fn has_occupied(&self, c0: Coord, c1: Coord) -> bool {
        self.occupied.calc_sum(c0, c1) > 0
    }
}

/// 単体のアイテム。高さと幅を持つ。
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Default, Hash)]
pub struct Item {
    height: usize,
    width: usize,
}

impl Item {
    pub fn new(height: usize, width: usize) -> Self {
        assert!(height > 0);
        assert!(width > 0);
        assert!(height <= GameState::MAX_ITEM_SIZE);
        assert!(width <= GameState::MAX_ITEM_SIZE);

        Self { height, width }
    }

    pub fn height(&self) -> usize {
        self.height
    }

    pub fn width(&self) -> usize {
        self.width
    }

    /// 左上の座標を指定して右下の座標を返す。
    pub fn bottom_right(&self, coord: Coord) -> Coord {
        Coord::new(coord.row + self.height, coord.col + self.width)
    }

    /// 90度回転させたアイテムを返す。回転させても高さと幅が同じ場合はNoneを返す。
    pub fn rotate(&self) -> Option<Self> {
        if self.height != self.width {
            Some(Self::new(self.width, self.height))
        } else {
            None
        }
    }
}

/// 同じ形状のアイテムを複数個まとめたグループ。
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Default, Hash)]
pub struct ItemGroup {
    pub item: Item,
    pub count: usize,
}

impl ItemGroup {
    pub fn new(item: Item, count: usize) -> Self {
        Self { item, count }
    }
}

/// 盤面上に配置されたアイテム。
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Default, Hash)]
pub struct PlacedItem {
    item: Item,
    coord: Coord,
}

impl PlacedItem {
    pub fn new(item: Item, coord: Coord) -> Self {
        Self { item, coord }
    }
}

/// 2次元累積和を計算する構造体。
#[derive(Debug, Clone)]
pub struct PrefixSumMap2d<T: NumAssign + Clone + Copy> {
    width: usize,
    height: usize,
    map: Map2d<T>,
}

impl<T: NumAssign + Clone + Copy> PrefixSumMap2d<T> {
    fn new(map: &Map2d<T>) -> Self {
        let width = map.width();
        let height = map.height();

        let mut prefix_map = Map2d::new_with(T::zero(), width + 1, height + 1);

        for row in 0..height {
            for col in 0..width - 1 {
                let c0 = Coord::new(row, col);
                let c1 = Coord::new(row, col + 1);
                prefix_map[c1] += map[c0];
            }
        }

        for col in 0..width {
            for row in 0..height - 1 {
                let c0 = Coord::new(row, col);
                let c1 = Coord::new(row + 1, col);
                prefix_map[c1] += map[c0];
            }
        }

        Self {
            width,
            height,
            map: prefix_map,
        }
    }

    /// [c0.row, c1.row) x [c0.col, c1.col) の範囲の和を計算する。
    fn calc_sum(&self, c0: Coord, c1: Coord) -> T {
        assert!(c1.row <= self.height);
        assert!(c1.col <= self.width);
        assert!(c0.row <= c1.row);
        assert!(c0.col <= c1.col);

        let mut sum = T::zero();
        sum += self.map[c1];
        sum += self.map[c0];
        sum -= self.map[Coord::new(c0.row, c1.col)];
        sum -= self.map[Coord::new(c1.row, c0.col)];
        sum
    }

    fn width(&self) -> usize {
        self.width
    }

    fn height(&self) -> usize {
        self.height
    }
}

import { type FC, useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import Board from './Board';
import ControlPane from './ControlPane';
import ItemPane, { type PlacedItem, type ItemSet } from './ItemPane';
import { getRotatedHeight, getRotatedWidth } from './ItemPane';
import Worker from './workers/ProbCalcWorker?worker';

export class ItemAndPlacement {
  item: ItemSet;
  placements: PlacedItem[];

  constructor(item: ItemSet, placements: PlacedItem[]) {
    this.item = item;
    this.placements = placements;
  }
}

const clampPosition = (value: number, size: number, boardSize: number) => {
  return Math.min(Math.max(value, 1), boardSize - size + 1);
};

const shoppingBag = { width: 3, height: 2 } as const;
const receipt = { width: 1, height: 3 } as const;
const fountainPen = { width: 2, height: 1 } as const;
const toyBox = { width: 4, height: 2 } as const;
const potatoChips = { width: 2, height: 2 } as const;
const gameMagazine = { width: 3, height: 3 } as const;
const ambrella = { width: 1, height: 4 } as const;
const predefinedItems: ItemSet[][] = [
  [
    { item: { ...shoppingBag, index: 1 }, count: 1 },
    { item: { ...receipt, index: 2 }, count: 3 },
    { item: { ...fountainPen, index: 3 }, count: 5 },
  ],
  [
    { item: { ...toyBox, index: 1 }, count: 1 },
    { item: { ...potatoChips, index: 2 }, count: 2 },
    { item: { ...receipt, index: 3 }, count: 3 },
  ],
  [
    { item: { ...gameMagazine, index: 1 }, count: 1 },
    { item: { ...ambrella, index: 2 }, count: 2 },
    { item: { ...fountainPen, index: 3 }, count: 4 },
  ],
  [
    { item: { ...shoppingBag, index: 1 }, count: 1 },
    { item: { ...receipt, index: 2 }, count: 3 },
    { item: { ...fountainPen, index: 3 }, count: 5 },
  ],
  [
    { item: { ...toyBox, index: 1 }, count: 1 },
    { item: { ...potatoChips, index: 2 }, count: 2 },
    { item: { ...receipt, index: 3 }, count: 3 },
  ],
  [
    { item: { ...gameMagazine, index: 1 }, count: 1 },
    { item: { ...ambrella, index: 2 }, count: 2 },
    { item: { ...fountainPen, index: 3 }, count: 4 },
  ],
  [
    { item: { ...potatoChips, index: 1 }, count: 2 },
    { item: { ...receipt, index: 2 }, count: 3 },
    { item: { ...fountainPen, index: 3 }, count: 6 },
  ],
] as const;

const MainArea: FC = () => {
  const [items, setItems] = useState(
    predefinedItems[0].map((itemSet) => new ItemAndPlacement(itemSet, [])),
  );
  const [probs, setProbs] = useState<number[][] | null>(null);
  const [showProbs, setShowProbs] = useState([true, true, true]);
  const [isRunning, setIsRunning] = useState(false);
  const [openMap, setOpenMap] = useState(Array(45).fill(false) as boolean[]);
  const [workerResetCnt, setWorkerResetCnt] = useState(0);

  // runUuid: 確率計算実行時に発行されたUUID
  // opUuid: 確率計算実行時または直近の入力変更時に発行されたUUID
  // runUuid === opUuidのとき、確率計算が実行されたばかりなので再度の確率計算を推奨しない
  // runUuid !== opUuidのとき、入力が変更されているので確率計算を推奨する
  const [runUuid, setRunUuid] = useState<string>(crypto.randomUUID());
  const [opUuid, setOpUuid] = useState<string>(crypto.randomUUID());

  if (items.some((item) => item.placements.length > item.item.count)) {
    const newItems = items.map((item) => {
      return {
        ...item,
        placements: [...item.placements.slice(0, item.item.count)],
      };
    });

    setItems(newItems);
  }

  if (
    items.some((item) =>
      item.placements.some(
        (pl) =>
          pl.row !== clampPosition(pl.row, getRotatedHeight(pl), 5) ||
          pl.col !== clampPosition(pl.col, getRotatedWidth(pl), 9),
      ),
    )
  ) {
    const newItems = items.map((item) => {
      return {
        ...item,
        placements: item.placements.map((pl) => {
          return {
            ...pl,
            row: clampPosition(pl.row, getRotatedHeight(pl), 5),
            col: clampPosition(pl.col, getRotatedWidth(pl), 9),
          };
        }),
      };
    });

    setItems(newItems);
  }

  const onModifyItem = (item: ItemSet) => {
    const newItems = [...items];
    newItems[item.item.index - 1].item = item;

    newItems[item.item.index - 1].placements = newItems[
      item.item.index - 1
    ].placements.map((pl) => {
      return {
        ...pl,
        item: item.item,
      };
    });

    setItems(newItems);
    setOpUuid(crypto.randomUUID());
  };

  const onAddPlacedItem = (item: PlacedItem) => {
    const newItems = [...items];
    items[item.item.index - 1].placements.push(item);
    setItems(newItems);
    setOpUuid(crypto.randomUUID());
  };

  const onModifyPlacedItem = (item: PlacedItem) => {
    const newItems = [...items];

    for (let i = 0; i < newItems[item.item.index - 1].placements.length; i++) {
      if (newItems[item.item.index - 1].placements[i].id === item.id) {
        newItems[item.item.index - 1].placements[i] = item;
      }
    }

    setItems(newItems);
    setOpUuid(crypto.randomUUID());
  };

  const onRemovePlacedItem = (item: PlacedItem) => {
    const newItems = [...items];

    newItems[item.item.index - 1].placements = newItems[
      item.item.index - 1
    ].placements.filter((it) => it.id !== item.id);

    setItems(newItems);
    setOpUuid(crypto.randomUUID());
  };

  // 確率計算worker周り
  const probCalcWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    probCalcWorkerRef.current = new Worker();

    probCalcWorkerRef.current.onmessage = (e) => {
      const { probs, error } = e.data as { probs: number[][]; error: string };

      if (error !== '') {
        alert(error);
        setProbs(null);
      } else {
        setProbs(probs);
      }

      setIsRunning(false);

      const uuid = crypto.randomUUID();
      setRunUuid(uuid);
      setOpUuid(uuid);
    };

    return () => {
      probCalcWorkerRef.current?.terminate();
    };
    // countが変化したらWorkerを再生成
  }, [workerResetCnt]);

  const onExecute = () => {
    setIsRunning(true);

    if (probCalcWorkerRef.current != null) {
      const data = {
        item_and_placement: items,
        open_map: openMap,
      };
      probCalcWorkerRef.current.postMessage(data);
    }
  };

  const onToggleShowProb = (index: number) => {
    const newShowProbs = [...showProbs];
    newShowProbs[index] = !newShowProbs[index];
    setShowProbs(newShowProbs);
  };

  const onToggleOpen = (index: number) => {
    const newOpenMap = [...openMap];
    newOpenMap[index] = !newOpenMap[index];
    setOpenMap(newOpenMap);
    setOpUuid(crypto.randomUUID());
  };

  const onItemPresetApply = (preset: number) => {
    if (!window.confirm('現在の入力内容はリセットされます。よろしいですか？')) {
      return;
    }

    setItems(
      predefinedItems[preset].map(
        (itemSet) => new ItemAndPlacement(itemSet, []),
      ),
    );
    setProbs(null);
    setOpenMap(Array(45).fill(false));
    setOpUuid(crypto.randomUUID());
    setIsRunning(false);
    setWorkerResetCnt((prev) => prev + 1);
  };

  return (
    <Box mb={2}>
      <Box my={2}>
        <Board
          placedItems={items.map((item) => item.placements).flat()}
          probs={probs}
          openMap={openMap}
          showProb={showProbs}
          onToggleOpen={onToggleOpen}
        ></Board>
      </Box>
      <Box my={2}>
        <ControlPane
          itemAndPlacements={items}
          openPanels={openMap}
          isRunning={isRunning}
          showProb={showProbs}
          recommendToRun={runUuid !== opUuid}
          onExecute={onExecute}
          onToggleShowProb={onToggleShowProb}
          onItemPresetApply={onItemPresetApply}
        ></ControlPane>
      </Box>
      <Grid container spacing={2}>
        {items.map((item, index) => (
          <Grid item xs={4} key={`item-pane-grid-${index}`}>
            <ItemPane
              key={`item-pane-${index}`}
              itemSet={item.item}
              placedItems={item.placements}
              onModifyItem={onModifyItem}
              onAddPlacedItem={onAddPlacedItem}
              onModifyPlacedItem={onModifyPlacedItem}
              onRemovePlacedItem={onRemovePlacedItem}
            ></ItemPane>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MainArea;

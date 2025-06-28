import { type FC, useState, useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
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

// 在庫管理のアイテム
/*
const shoppingBag = { width: 3, height: 2 } as const;
const receipt = { width: 1, height: 3 } as const;
const fountainPen = { width: 2, height: 1 } as const;
const toyBox = { width: 4, height: 2 } as const;
const potatoChips = { width: 2, height: 2 } as const;
const gameMagazine = { width: 3, height: 3 } as const;
const ambrella = { width: 1, height: 4 } as const;
*/

// 五塵来降のアイテム
/*
const longxutang = { width: 3, height: 2 } as const; // 龍のひげ飴
const ludagun = { width: 3, height: 1 } as const; // ローダーグン
const yuebing = { width: 2, height: 1 } as const; // 月餅
const mahua = { width: 4, height: 2 } as const; // 麻花
const xingrenDoufu = { width: 2, height: 2 } as const; // 杏仁豆腐
const banji = { width: 3, height: 3 } as const; // 班戟（パンケーキ）
const tanghulu = { width: 1, height: 4 } as const; // 糖葫蘆
*/

// 秘密のミッドナイトパーティーのアイテム
/*
const slippers = { width: 3, height: 2 } as const; // スリッパ
const characterToothbrush = { width: 3, height: 1 } as const; // キャラもの歯ブラシ
const purpleScarf = { width: 2, height: 1 } as const; // 紫のマフラー
const boardGame = { width: 4, height: 2 } as const; // ボードゲーム「KIVOPOLY」
const hairband = { width: 2, height: 2 } as const; // ヘアバンド
const characterPillow = { width: 3, height: 3 } as const; // キャラものクッション
const bodyPillow = { width: 1, height: 4 } as const; // 抱き枕
*/

// 百ヨリ出ズル一輪ノ 〜いざ尋常に、水上勝負〜 のアイテム
const waterGun = { width: 3, height: 2 } as const; // 水鉄砲
const smartphoneCase = { width: 3, height: 1 } as const; // スマホケース
const sunscreen = { width: 1, height: 2 } as const; // 日焼け止め
const surfboard = { width: 4, height: 2 } as const; // サーフボード
const parasol = { width: 1, height: 4 } as const; // 日傘
const swimRing = { width: 3, height: 3 } as const; // 浮き輪
const bandana = { width: 2, height: 2 } as const; // バンダナ

const predefinedItems: ItemSet[][] = [
  [
    { item: { ...waterGun, index: 1 }, count: 2 },
    { item: { ...smartphoneCase, index: 2 }, count: 5 },
    { item: { ...sunscreen, index: 3 }, count: 2 },
  ],
  [
    { item: { ...surfboard, index: 1 }, count: 1 },
    { item: { ...parasol, index: 2 }, count: 2 },
    { item: { ...smartphoneCase, index: 3 }, count: 5 },
  ],
  [
    { item: { ...swimRing, index: 1 }, count: 1 },
    { item: { ...bandana, index: 2 }, count: 4 },
    { item: { ...sunscreen, index: 3 }, count: 3 },
  ],
  [
    { item: { ...waterGun, index: 1 }, count: 2 },
    { item: { ...smartphoneCase, index: 2 }, count: 5 },
    { item: { ...sunscreen, index: 3 }, count: 2 },
  ],
  [
    { item: { ...surfboard, index: 1 }, count: 1 },
    { item: { ...parasol, index: 2 }, count: 2 },
    { item: { ...smartphoneCase, index: 3 }, count: 5 },
  ],
  [
    { item: { ...swimRing, index: 1 }, count: 1 },
    { item: { ...bandana, index: 2 }, count: 4 },
    { item: { ...sunscreen, index: 3 }, count: 3 },
  ],
  [
    // 7週目以降の数量は仮
    { item: { ...surfboard, index: 1 }, count: 1 },
    { item: { ...smartphoneCase, index: 2 }, count: 1 },
    { item: { ...sunscreen, index: 3 }, count: 1 },
  ],
] as const;

/**
 * ローカルストレージに保存された値を取得・更新する
 */
export function useLocalStorage<S>(
  key: string,
  initValue: S,
): [S, (setStateAction: S | ((prevState: S) => S)) => void] {
  const [value, setValue] = useState<S>(() => {
    const savedValue = localStorage.getItem(key);
    try {
      return savedValue !== null ? (JSON.parse(savedValue) as S) : initValue;
    } catch (e) {
      return initValue;
    }
  });

  const setLocalStorageValue = useCallback(
    (setStateAction: S | ((prevState: S) => S)) => {
      const newValue =
        setStateAction instanceof Function
          ? setStateAction(value)
          : setStateAction;

      localStorage.setItem(key, JSON.stringify(newValue));
      setValue(() => newValue);
    },
    [key, value],
  );

  return [value, setLocalStorageValue] as const;
}

const MainArea: FC = () => {
  const { t } = useTranslation('MainArea');
  const { t: errorT } = useTranslation('Error');

  const [items, setItems] = useLocalStorage(
    'items',
    predefinedItems[0].map((itemSet) => new ItemAndPlacement(itemSet, [])),
  );
  const [probs, setProbs] = useState<number[][] | null>(null);
  const [isMaxProbs, setIsMaxProbs] = useState<boolean[][] | null>(null);
  const [showProbs, setShowProbs] = useState([true, true, true]);
  const [isRunning, setIsRunning] = useState(false);
  const [openMap, setOpenMap] = useLocalStorage(
    'openMap',
    Array(45).fill(false) as boolean[],
  );
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
    newItems[item.item.index - 1].placements.push(item);
    setItems(newItems);

    // アイテムがある場所のマス目を自動で開ける
    const newOpenMap = [...openMap];
    for (let i = item.row; i < item.row + getRotatedHeight(item); i++) {
      for (let j = item.col; j < item.col + getRotatedWidth(item); j++) {
        newOpenMap[(i - 1) * 9 + (j - 1)] = true;
      }
    }

    setOpenMap(newOpenMap);
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
        const errors = error.split(' ');
        alert(errorT(errors[0], { error: errors.slice(1) }));
        setProbs(null);
        setIsMaxProbs(null);
      } else {
        // アイテムの組合せフラグごとに、各マスの確率を小数点第一位まで見て、
        // 最大値に一致するものにフラグを付けたい
        // 3種類のアイテムについてオンオフの組合せは8通り
        const roundProb = (prob: number) => Math.round(prob * 1000) / 1000;
        const isMaxProbs = Array.from(
          new Array(1 << 3),
          () => new Array(45).fill(false) as boolean[],
        );

        for (let itemFlag = 0; itemFlag < 1 << 3; itemFlag++) {
          let roundedMax = 0;
          const currentProbs = probs[itemFlag];
          const currentIsMaxProbs = isMaxProbs[itemFlag];

          // 開いているマスの中から一番確率が高いものを探す
          for (let i = 0; i < currentProbs.length; i++) {
            const rounded = roundProb(currentProbs[i]);
            if (!openMap[i] && rounded > roundedMax) {
              roundedMax = rounded;
            }
          }

          // 一番確率の高いものと一致していたらフラグをセット
          // ただし、確率が0のものは除外
          for (let i = 0; i < currentProbs.length; i++) {
            const rounded = roundProb(currentProbs[i]);
            if (rounded === roundedMax && rounded > 0) {
              currentIsMaxProbs[i] = true;
            }
          }
        }

        setProbs(probs);
        setIsMaxProbs(isMaxProbs);
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
  }, [openMap, workerResetCnt]);

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
    if (!window.confirm(t('item_preset_apply_confirm'))) {
      return;
    }

    setItems(
      predefinedItems[preset].map(
        (itemSet) => new ItemAndPlacement(itemSet, []),
      ),
    );
    setProbs(null);
    setIsMaxProbs(null);
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
          isMaxProbs={isMaxProbs}
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

import { type FC, useState, useRef, useEffect, useCallback } from 'react';
import { Alert, Box, Snackbar } from '@mui/material';
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

type PresetItemSet = Omit<ItemSet, 'count'> & {
  /** nullは数量不明を表し、プリセット適用時にunknownPresetCountFallbackへ変換する。 */
  count: number | null;
};

const unknownPresetCountFallback = 1;

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
/*
const waterGun = { width: 3, height: 2 } as const; // 水鉄砲
const smartphoneCase = { width: 3, height: 1 } as const; // スマホケース
const sunscreen = { width: 1, height: 2 } as const; // 日焼け止め
const surfboard = { width: 4, height: 2 } as const; // サーフボード
const parasol = { width: 1, height: 4 } as const; // 日傘
const swimRing = { width: 3, height: 3 } as const; // 浮き輪
const bandana = { width: 2, height: 2 } as const; // バンダナ
*/

// DIVE into OCEAN! のアイテム
/*
const seahorse = { width: 3, height: 1 } as const; // タツノオトシゴ
const seaweed = { width: 1, height: 4 } as const; // 海藻
const seaUrchin = { width: 3, height: 2 } as const; // ウニ
const nudibranch = { width: 1, height: 2 } as const; // ウミウシ
const starfish = { width: 2, height: 2 } as const; // ヒトデ
const spiralShell = { width: 4, height: 2 } as const; // 巻貝
const turtleShell = { width: 3, height: 3 } as const; // 亀の甲羅
*/

// 踊らされし芸術 ～象牙の塔と招かれざる客～ のアイテム
const brooch = { width: 3, height: 1 } as const; // ブローチ
const ceremonialRapier = { width: 1, height: 4 } as const; // 儀礼用レイピア
const painting = { width: 3, height: 2 } as const; // 絵画
const quill = { width: 1, height: 2 } as const; // 羽ペン
const antiquePocketWatch = { width: 2, height: 2 } as const; // 古びた懐中時計
const ceramics = { width: 4, height: 2 } as const; // 陶磁器
const marbleBust = { width: 3, height: 3 } as const; // 大理石の胸像

const predefinedItems: PresetItemSet[][] = [
  [
    { item: { ...brooch, index: 1 }, count: 4 },
    { item: { ...ceremonialRapier, index: 2 }, count: 3 },
    { item: { ...painting, index: 3 }, count: 1 },
  ],
  [
    { item: { ...quill, index: 1 }, count: 3 },
    { item: { ...antiquePocketWatch, index: 2 }, count: 4 },
    { item: { ...ceramics, index: 3 }, count: 1 },
  ],
  [
    { item: { ...brooch, index: 1 }, count: 3 },
    { item: { ...antiquePocketWatch, index: 2 }, count: 3 },
    { item: { ...marbleBust, index: 3 }, count: 1 },
  ],
  [
    { item: { ...brooch, index: 1 }, count: 2 },
    { item: { ...antiquePocketWatch, index: 2 }, count: 3 },
    { item: { ...painting, index: 3 }, count: 2 },
  ],
  [
    { item: { ...brooch, index: 1 }, count: 4 },
    { item: { ...ceremonialRapier, index: 2 }, count: 3 },
    { item: { ...painting, index: 3 }, count: 1 },
  ],
  [
    { item: { ...quill, index: 1 }, count: 3 },
    { item: { ...antiquePocketWatch, index: 2 }, count: 4 },
    { item: { ...ceramics, index: 3 }, count: 1 },
  ],
  [
    { item: { ...brooch, index: 1 }, count: 3 },
    { item: { ...antiquePocketWatch, index: 2 }, count: 3 },
    { item: { ...marbleBust, index: 3 }, count: 1 },
  ],
  [
    { item: { ...brooch, index: 1 }, count: 2 },
    { item: { ...antiquePocketWatch, index: 2 }, count: 3 },
    { item: { ...painting, index: 3 }, count: 2 },
  ],
  [
    { item: { ...brooch, index: 1 }, count: 4 },
    { item: { ...ceremonialRapier, index: 2 }, count: 3 },
    { item: { ...painting, index: 3 }, count: 1 },
  ],
  [
    { item: { ...quill, index: 1 }, count: 3 },
    { item: { ...antiquePocketWatch, index: 2 }, count: 4 },
    { item: { ...ceramics, index: 3 }, count: 1 },
  ],
  [
    { item: { ...brooch, index: 1 }, count: 3 },
    { item: { ...antiquePocketWatch, index: 2 }, count: 3 },
    { item: { ...marbleBust, index: 3 }, count: 1 },
  ],
  [
    { item: { ...brooch, index: 1 }, count: 2 },
    { item: { ...antiquePocketWatch, index: 2 }, count: 3 },
    { item: { ...painting, index: 3 }, count: 2 },
  ],
  [
    { item: { ...brooch, index: 1 }, count: 2 },
    { item: { ...ceremonialRapier, index: 2 }, count: 2 },
    { item: { ...ceramics, index: 3 }, count: 2 },
  ],
] as const;

const createItemsFromPreset = (presetItems: PresetItemSet[]) =>
  presetItems.map(
    ({ item, count }) =>
      new ItemAndPlacement(
        { item, count: count ?? unknownPresetCountFallback },
        [],
      ),
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isIntegerInRange = (value: unknown, min: number, max: number) =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max;

const isValidStoredItems = (value: unknown): value is ItemAndPlacement[] => {
  if (!Array.isArray(value) || value.length !== 3) {
    return false;
  }

  return value.every((entry, itemIndex) => {
    if (
      !isRecord(entry) ||
      !isRecord(entry.item) ||
      !isRecord(entry.item.item) ||
      !Array.isArray(entry.placements)
    ) {
      return false;
    }

    const item = entry.item.item;
    const expectedIndex = itemIndex + 1;
    if (
      !isIntegerInRange(item.width, 1, 4) ||
      !isIntegerInRange(item.height, 1, 4) ||
      item.index !== expectedIndex ||
      !isIntegerInRange(entry.item.count, 0, 7)
    ) {
      return false;
    }

    return entry.placements.every((placement) => {
      if (!isRecord(placement) || !isRecord(placement.item)) {
        return false;
      }

      const placedItem = placement.item;

      return (
        placedItem.width === item.width &&
        placedItem.height === item.height &&
        placedItem.index === expectedIndex &&
        typeof placement.rotated === 'boolean' &&
        isIntegerInRange(placement.row, 1, 5) &&
        isIntegerInRange(placement.col, 1, 9) &&
        typeof placement.id === 'string' &&
        placement.id.length > 0
      );
    });
  });
};

const isValidOpenMap = (value: unknown): value is boolean[] =>
  Array.isArray(value) &&
  value.length === 45 &&
  value.every((open) => typeof open === 'boolean');

/**
 * ローカルストレージに保存された値を取得・更新する
 */
export function useLocalStorage<S>(
  key: string,
  initValue: S,
  isValid: (value: unknown) => value is S,
): [S, (setStateAction: S | ((prevState: S) => S)) => void] {
  const [value, setValue] = useState<S>(() => {
    // ブラウザ環境チェック
    if (typeof window === 'undefined') {
      return initValue;
    }

    try {
      const savedValue = localStorage.getItem(key);
      if (savedValue === null) {
        return initValue;
      }

      const parsedValue: unknown = JSON.parse(savedValue);
      if (isValid(parsedValue)) {
        return parsedValue;
      }

      localStorage.removeItem(key);

      return initValue;
    } catch {
      try {
        localStorage.removeItem(key);
      } catch {
        // localStorage自体が利用できない場合は削除失敗を無視する
      }

      // 読み取りまたはパースに失敗したので初期値を返す
      return initValue;
    }
  });

  const setLocalStorageValue = useCallback(
    (setStateAction: S | ((prevState: S) => S)) => {
      const newValue =
        setStateAction instanceof Function
          ? setStateAction(value)
          : setStateAction;

      // ブラウザ環境チェック
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(key, JSON.stringify(newValue));
        } catch (e) {
          // 保存失敗時は無視する
        }
      }
      setValue(() => newValue);
    },
    [key, value],
  );

  return [value, setLocalStorageValue] as const;
}

const MainArea: FC = () => {
  const { t } = useTranslation('MainArea');
  const { t: errorT } = useTranslation('Error');
  const { t: controlPaneT } = useTranslation('ControlPane');

  const [items, setItems] = useLocalStorage(
    'items',
    createItemsFromPreset(predefinedItems[0]),
    isValidStoredItems,
  );
  const [probs, setProbs] = useState<number[][] | null>(null);
  const [isMaxProbs, setIsMaxProbs] = useState<boolean[][] | null>(null);
  const [showProbs, setShowProbs] = useState([true, true, true]);
  const [isRunning, setIsRunning] = useState(false);
  const [presetAppliedToast, setPresetAppliedToast] = useState<{
    id: string;
    message: string;
    severity: 'success' | 'warning';
  } | null>(null);
  const [openMap, setOpenMap] = useLocalStorage(
    'openMap',
    Array(45).fill(false) as boolean[],
    isValidOpenMap,
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
  const errorTRef = useRef(errorT);

  useEffect(() => {
    errorTRef.current = errorT;
  }, [errorT]);

  useEffect(() => {
    probCalcWorkerRef.current = new Worker();

    probCalcWorkerRef.current.onmessage = (e) => {
      const { probs, error } = e.data as { probs: number[][]; error: string };

      if (error !== '') {
        const errors = error.split(' ');
        alert(errorTRef.current(errors[0], { error: errors.slice(1) }));
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
    const presetItems = predefinedItems[preset];
    const hasUnknownQuantity = presetItems.some(({ count }) => count == null);

    setItems(createItemsFromPreset(presetItems));
    setProbs(null);
    setIsMaxProbs(null);
    setOpenMap(Array(45).fill(false));
    setOpUuid(crypto.randomUUID());
    setIsRunning(false);
    setWorkerResetCnt((prev) => prev + 1);
    const presetLabel = controlPaneT(`predefined_choice_select.${preset}`);
    setPresetAppliedToast({
      id: crypto.randomUUID(),
      message: t(
        hasUnknownQuantity
          ? 'item_preset_applied_with_unknown_quantity_toast'
          : 'item_preset_applied_toast',
        { presetLabel },
      ),
      severity: hasUnknownQuantity ? 'warning' : 'success',
    });
  };

  const onResetMap = () => {
    if (!window.confirm(t('reset_confirm'))) {
      return;
    }

    setItems(items.map((item) => new ItemAndPlacement(item.item, [])));
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
          onResetMap={onResetMap}
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
      <Snackbar
        key={presetAppliedToast?.id}
        open={presetAppliedToast !== null}
        autoHideDuration={3000}
        onClose={() => {
          setPresetAppliedToast(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {presetAppliedToast == null ? undefined : (
          <Alert
            severity={presetAppliedToast.severity}
            variant="filled"
            onClose={() => {
              setPresetAppliedToast(null);
            }}
          >
            {presetAppliedToast.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default MainArea;

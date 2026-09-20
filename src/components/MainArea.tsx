import { type FC, useState, useRef, useEffect, useCallback } from 'react';
import { Alert, Box, Snackbar } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Board from './Board';
import ControlPane from './ControlPane';
import ItemPane, { type PlacedItem, type ItemSet } from './ItemPane';
import {
  getRotatedHeight,
  getRotatedWidth,
  findSmartPlacement,
} from './ItemPane';
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
const seahorse = { width: 3, height: 1 } as const; // タツノオトシゴ
const seaweed = { width: 1, height: 4 } as const; // 海藻
const seaUrchin = { width: 3, height: 2 } as const; // ウニ
const nudibranch = { width: 1, height: 2 } as const; // ウミウシ
const starfish = { width: 2, height: 2 } as const; // ヒトデ
const spiralShell = { width: 4, height: 2 } as const; // 巻貝
const turtleShell = { width: 3, height: 3 } as const; // 亀の甲羅

const predefinedItems: PresetItemSet[][] = [
  [
    { item: { ...seahorse, index: 1 }, count: 4 },
    { item: { ...seaweed, index: 2 }, count: 3 },
    { item: { ...seaUrchin, index: 3 }, count: 1 },
  ],
  [
    { item: { ...nudibranch, index: 1 }, count: 3 },
    { item: { ...starfish, index: 2 }, count: 4 },
    { item: { ...spiralShell, index: 3 }, count: 1 },
  ],
  [
    { item: { ...seahorse, index: 1 }, count: 3 },
    { item: { ...starfish, index: 2 }, count: 3 },
    { item: { ...turtleShell, index: 3 }, count: 1 },
  ],
  [
    { item: { ...seahorse, index: 1 }, count: 2 },
    { item: { ...starfish, index: 2 }, count: 3 },
    { item: { ...seaUrchin, index: 3 }, count: 2 },
  ],
  [
    { item: { ...seahorse, index: 1 }, count: 4 },
    { item: { ...seaweed, index: 2 }, count: 3 },
    { item: { ...seaUrchin, index: 3 }, count: 1 },
  ],
  [
    { item: { ...nudibranch, index: 1 }, count: 3 },
    { item: { ...starfish, index: 2 }, count: 4 },
    { item: { ...spiralShell, index: 3 }, count: 1 },
  ],
  [
    { item: { ...seahorse, index: 1 }, count: 3 },
    { item: { ...starfish, index: 2 }, count: 3 },
    { item: { ...turtleShell, index: 3 }, count: 1 },
  ],
  [
    { item: { ...seahorse, index: 1 }, count: 2 },
    { item: { ...starfish, index: 2 }, count: 3 },
    { item: { ...seaUrchin, index: 3 }, count: 2 },
  ],
  [
    { item: { ...seahorse, index: 1 }, count: 4 },
    { item: { ...seaweed, index: 2 }, count: 3 },
    { item: { ...seaUrchin, index: 3 }, count: 1 },
  ],
  [
    { item: { ...nudibranch, index: 1 }, count: 3 },
    { item: { ...starfish, index: 2 }, count: 4 },
    { item: { ...spiralShell, index: 3 }, count: 1 },
  ],
  [
    { item: { ...seahorse, index: 1 }, count: 3 },
    { item: { ...starfish, index: 2 }, count: 3 },
    { item: { ...turtleShell, index: 3 }, count: 1 },
  ],
  [
    { item: { ...seahorse, index: 1 }, count: 2 },
    { item: { ...starfish, index: 2 }, count: 3 },
    { item: { ...seaUrchin, index: 3 }, count: 2 },
  ],
  [
    { item: { ...seahorse, index: 1 }, count: 2 },
    { item: { ...seaweed, index: 2 }, count: 2 },
    { item: { ...spiralShell, index: 3 }, count: 2 },
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
  // 自動再計算が「成立する配置なし」で失敗したときの表示用
  const [noValidConfig, setNoValidConfig] = useState(false);
  const [showProbs, setShowProbs] = useState([true, true, true]);
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
  const [probScale, setProbScale] = useLocalStorage<'max' | 'minmax'>(
    'probScale',
    'max',
    (v): v is 'max' | 'minmax' => v === 'max' || v === 'minmax',
  );
  const [workerResetCnt, setWorkerResetCnt] = useState(0);

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
  };

  const onAddPlacedItem = (item: PlacedItem) => {
    // スマート配置（BAAS版と同じ）:
    // クリックしたセルが必ず備品に覆われるよう、重ならない合法アンカーを
    // 近い順に探索する。なければ盤面全体の最寄り、どこにも置けなければ何もしない。
    const placed = items.map((entry) => entry.placements).flat();
    const anchor = findSmartPlacement(item, item.row, item.col, placed, openMap);

    if (anchor === null) return;

    const newItems = [...items];
    newItems[item.item.index - 1].placements.push({
      ...item,
      row: anchor.row,
      col: anchor.col,
    });
    setItems(newItems);
  };

  // 備品の移動・回転を反映する（マス目の開閉状態は変更しない。
  // 開閉はユーザーが明示的にクリックして行うものであり、
  // ドラッグに自動開閉は連動させない）
  const applyPlacementChange = (moved: PlacedItem) => {
    const newItems = [...items];
    const target = newItems[moved.item.index - 1];

    target.placements = target.placements.map((pl) =>
      pl.id === moved.id ? moved : pl,
    );

    setItems(newItems);
  };

  const onMovePlacedItem = (item: PlacedItem, row: number, col: number) => {
    applyPlacementChange({ ...item, row, col });
  };

  const onRotatePlacedItem = (item: PlacedItem) => {
    const rotated = { ...item, rotated: !item.rotated };
    // 回転後の形状を、元の位置を覆う最寄りの合法アンカーに置く。
    // そのまま回転できるなら元の位置（距離0）が選ばれる。
    // どこにも置けない場合は何もしない。
    const placed = items.map((entry) => entry.placements).flat();
    const anchor = findSmartPlacement(
      rotated,
      item.row,
      item.col,
      placed,
      openMap,
    );

    if (anchor === null) return;

    applyPlacementChange({ ...rotated, row: anchor.row, col: anchor.col });
  };

  const onRemovePlacedItem = (item: PlacedItem) => {
    const newItems = [...items];

    newItems[item.item.index - 1].placements = newItems[
      item.item.index - 1
    ].placements.filter((it) => it.id !== item.id);

    // 開けたマス目は開いたままにする
    setItems(newItems);
  };

  // 確率計算worker周り
  const probCalcWorkerRef = useRef<Worker | null>(null);
  const errorTRef = useRef(errorT);

  // Workerを常駐させ、openMapはref経由で常に最新値を参照する
  // （Workerの再生成はWASMの再初期化を伴い、開閉のたびに数百msかかるため）
  const openMapRef = useRef(openMap);

  useEffect(() => {
    openMapRef.current = openMap;
  }, [openMap]);

  // 直近で確率計算に渡した入力のキーと、計算の世代（run_id）
  const lastRunKeyRef = useRef<string | null>(null);
  const lastRunItemsKeyRef = useRef<string | null>(null);
  const runIdRef = useRef(0);
  const inputKey = JSON.stringify({ items, openMap });
  // 備品配置のみのキー。マスの開閉は配置分布を変えないため、
  // 開閉のたびに青枠を消す必要はない（消すと点滅して見える）。
  // 備品の移動・追加・削除のときだけ確率が古くなるので枠を消す。
  const inputItemsKey = JSON.stringify(items);
  const probsFresh = lastRunItemsKeyRef.current === inputItemsKey && probs !== null;

  useEffect(() => {
    errorTRef.current = errorT;
  }, [errorT]);

  useEffect(() => {
    probCalcWorkerRef.current = new Worker();

    probCalcWorkerRef.current.onmessage = (e) => {
      const { probs, error, run_id: runId } = e.data as {
        probs: number[][] | null;
        error: string;
        run_id: number;
      };

      // 計算中に投げた古い入力の結果は破棄する（last-write-wins）
      if (runId !== runIdRef.current) return;

      if (error !== '') {
        const errorKey = error.split(' ')[0];
        // no_valid_configuration は想定内：インライン警告で示す。
        // それ以外のエラーはバグ調査の手がかりとしてalertする
        if (errorKey !== 'no_valid_configuration') {
          const errors = error.split(' ');
          alert(errorTRef.current(errors[0], { error: errors.slice(1) }));
        }

        setProbs(null);
        setNoValidConfig(errorKey === 'no_valid_configuration');
      } else {
        setProbs(probs);
        setNoValidConfig(false);
      }
    };

    return () => {
      probCalcWorkerRef.current?.terminate();
    };
    // プリセット適用・リセット時のみWorkerを再生成する
  }, [workerResetCnt]);

  // 入力が変化したら50ms後に自動で再計算する。
  // 計算中でも新しい入力を続けて投げ、結果にはrun_idを付けて返してもらう。
  // 古い結果はonmessageで破棄するため、最後に入力した内容だけが画面に残る。
  useEffect(() => {
    if (lastRunKeyRef.current === inputKey) {
      return;
    }

    const timer = window.setTimeout(() => {
      lastRunKeyRef.current = inputKey;
      lastRunItemsKeyRef.current = inputItemsKey;
      runIdRef.current += 1;
      probCalcWorkerRef.current?.postMessage({
        item_and_placement: items,
        open_map: openMap,
        run_id: runIdRef.current,
      });
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [inputKey, inputItemsKey, items, openMap]);

  const onToggleShowProb = (index: number) => {
    const newShowProbs = [...showProbs];
    newShowProbs[index] = !newShowProbs[index];
    setShowProbs(newShowProbs);
  };

  const onToggleOpen = (index: number) => {
    const newOpenMap = [...openMap];
    newOpenMap[index] = !newOpenMap[index];
    setOpenMap(newOpenMap);
  };

  const onItemPresetApply = (preset: number) => {
    const presetItems = predefinedItems[preset];
    const hasUnknownQuantity = presetItems.some(({ count }) => count == null);

    setItems(createItemsFromPreset(presetItems));
    setProbs(null);
    setOpenMap(Array(45).fill(false));
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
    setOpenMap(Array(45).fill(false));
    setWorkerResetCnt((prev) => prev + 1);
  };

  return (
    <Box mb={2}>
      <Box
        my={2}
        display="grid"
        gridTemplateColumns={{ xs: 'minmax(0, 1fr)', md: 'minmax(520px, 1fr) auto' }}
        gap={2}
        alignItems="start"
      >
        <Box>
          <Board
            placedItems={items.map((item) => item.placements).flat()}
            probs={probs}
            openMap={openMap}
            showProb={showProbs}
            probScale={probScale}
            probsFresh={probsFresh}
            onToggleOpen={onToggleOpen}
            onMovePlacedItem={onMovePlacedItem}
            onRotatePlacedItem={onRotatePlacedItem}
            onRemovePlacedItem={onRemovePlacedItem}
          ></Board>
        </Box>
        <Box display="flex" flexDirection="column" gap={2}>
          {items.map((item, index) => (
            <ItemPane
              key={`item-pane-${index}`}
              itemSet={item.item}
              placedItems={item.placements}
              showProb={showProbs[index]}
              onToggleShowProb={() => {
                onToggleShowProb(index);
              }}
              onModifyItem={onModifyItem}
              onAddPlacedItem={onAddPlacedItem}
            ></ItemPane>
          ))}
        </Box>
      </Box>
      {noValidConfig && (
        <Alert severity="warning" sx={{ my: 1 }}>
          {t('no_valid_configuration_auto')}
        </Alert>
      )}
      <Box my={2}>
        <ControlPane
          itemAndPlacements={items}
          openPanels={openMap}
          probScale={probScale}
          onToggleProbScale={() =>
            { setProbScale(probScale === 'max' ? 'minmax' : 'max'); }
          }
          onItemPresetApply={onItemPresetApply}
          onResetMap={onResetMap}
        ></ControlPane>
      </Box>
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

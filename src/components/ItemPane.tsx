import { useEffect, useRef, useState, type FC } from 'react';
import { SvgIcon, Tooltip } from '@mui/material';
import { red, lightBlue, yellow } from '@mui/material/colors';
import { useTranslation } from 'react-i18next';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { usePlaceSelectHelper } from './PlaceSelectHelper';

export interface Item {
  width: number;
  height: number;
  index: number;
}

export interface PlacedItem {
  item: Item;
  rotated: boolean;
  row: number;
  col: number;
  id: string;
}

export function getRotatedHeight(placedItem: PlacedItem): number {
  return placedItem.rotated ? placedItem.item.width : placedItem.item.height;
}

export function getRotatedWidth(placedItem: PlacedItem): number {
  return placedItem.rotated ? placedItem.item.height : placedItem.item.width;
}

// ---- スマート配置（BAAS版と同じ規則）の共用ロジック ----
// Board（ドラッグの妥当性・ホバープレビュー）と MainArea（配置・回転）の
// 両方から使うため、備品の型と一緒にここに置く。

export const BOARD_ROWS = 5;
export const BOARD_COLS = 9;

/** (row, col) に置いた備品が既に開けたマス（空き確定）を覆うか。 */
export const coversOpenedCells = (
  item: PlacedItem,
  row: number,
  col: number,
  openMap: boolean[],
): boolean => {
  const h = getRotatedHeight(item);
  const w = getRotatedWidth(item);

  for (let r = row; r < row + h; r++) {
    for (let c = col; c < col + w; c++) {
      if (openMap[(r - 1) * BOARD_COLS + (c - 1)]) {
        return true;
      }
    }
  }

  return false;
};

/** (row, col) に置いた備品が他の備品と重なるか。 */
export const overlapsOthers = (
  item: PlacedItem,
  row: number,
  col: number,
  placedItems: PlacedItem[],
): boolean => {
  const h = getRotatedHeight(item);
  const w = getRotatedWidth(item);

  return placedItems.some(
    (pl) =>
      pl.id !== item.id &&
      row < pl.row + getRotatedHeight(pl) &&
      pl.row < row + h &&
      col < pl.col + getRotatedWidth(pl) &&
      pl.col < col + w,
  );
};

const isValidAnchor = (
  item: PlacedItem,
  row: number,
  col: number,
  placedItems: PlacedItem[],
  openMap: boolean[],
): boolean =>
  !coversOpenedCells(item, row, col, openMap) &&
  !overlapsOthers(item, row, col, placedItems);

/**
 * スマート配置（BAAS版と同じ）: クリックしたセルが必ず備品に覆われるよう、
 * 重ならない合法アンカーを近い順に探索する。
 * 1) クリックセルを覆う最寄りの合法アンカー
 * 2) なければ盤面全体で最も近い合法位置（フォールバック）
 * どこにも置けない場合は null。
 * 配置モードのホバー-preview（Board）と配置・回転（MainArea）で共用する。
 */
export const findSmartPlacement = (
  item: PlacedItem,
  clickRow: number,
  clickCol: number,
  placedItems: PlacedItem[],
  openMap: boolean[],
): { row: number; col: number } | null => {
  const height = getRotatedHeight(item);
  const width = getRotatedWidth(item);

  // 1) クリックセルを覆うアンカー候補（盤面内に収まるもののみ）
  const candidates: Array<{ row: number; col: number; dist: number }> = [];
  const rLo = Math.max(1, clickRow - height + 1);
  const rHi = Math.min(clickRow, BOARD_ROWS - height + 1);
  const cLo = Math.max(1, clickCol - width + 1);
  const cHi = Math.min(clickCol, BOARD_COLS - width + 1);

  for (let r = rLo; r <= rHi; r++) {
    for (let c = cLo; c <= cHi; c++) {
      candidates.push({
        row: r,
        col: c,
        dist: Math.abs(r - clickRow) + Math.abs(c - clickCol),
      });
    }
  }

  candidates.sort((a, b) => a.dist - b.dist);

  for (const cand of candidates) {
    if (isValidAnchor(item, cand.row, cand.col, placedItems, openMap)) {
      return { row: cand.row, col: cand.col };
    }
  }

  // 2) フォールバック: 盤面全体で最も近い合法位置
  let best: { row: number; col: number; dist: number } | null = null;

  for (let row = 1; row + height <= BOARD_ROWS + 1; row++) {
    for (let col = 1; col + width <= BOARD_COLS + 1; col++) {
      if (!isValidAnchor(item, row, col, placedItems, openMap)) {
        continue;
      }

      const dist = Math.abs(row - clickRow) + Math.abs(col - clickCol);
      if (best === null || dist < best.dist) {
        best = { row, col, dist };
      }
    }
  }

  return best;
};

export function isSquare(item: Item): boolean {
  return item.width === item.height;
}

export function isVertical(item: Item): boolean {
  return item.height > item.width;
}

export function getItemPalette(
  index: number,
): typeof red | typeof yellow | typeof lightBlue {
  return [red, yellow, lightBlue][(index - 1) % 3];
}

export interface ItemSet {
  item: Item;
  count: number;
}

// ---- サイズのお気に入り（localStorage、グループごと） ----

interface SizeFavorite {
  h: number;
  w: number;
}

const FAVORITES_KEY = 'sizeFavorites';

const loadFavorites = (groupIndex: number): SizeFavorite[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const all: unknown = raw !== null ? JSON.parse(raw) : [];
    if (Array.isArray(all) && Array.isArray(all[groupIndex])) {
      return (all[groupIndex] as unknown[]).filter(
        (value): value is SizeFavorite =>
          typeof value === 'object' &&
          value !== null &&
          typeof (value as SizeFavorite).h === 'number' &&
          typeof (value as SizeFavorite).w === 'number',
      );
    }
  } catch {
    // localStorage が使えない場合は何もしない
  }

  return [];
};

const saveFavorites = (groupIndex: number, favorites: SizeFavorite[]) => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed: unknown = raw !== null ? JSON.parse(raw) : [];
    const all: unknown[] = Array.isArray(parsed) ? parsed : [];
    while (all.length < 3) {
      all.push([]);
    }
    all[groupIndex] = favorites;
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(all));
  } catch {
    // 保存失敗時は無視する
  }
};

const favoriteSizeKey = (favorite: SizeFavorite): number =>
  Math.max(favorite.h, favorite.w) * 10 + Math.min(favorite.h, favorite.w);

const sortFavorites = (favorites: SizeFavorite[]): SizeFavorite[] =>
  [...favorites].sort((a, b) => favoriteSizeKey(a) - favoriteSizeKey(b));

// ---- スピンボックス風の数値入力（−/値/+、ホイールで加減） ----

const clampInt = (value: string, min: number, max: number): number | null => {
  const parsed = Math.round(Number(value));
  if (value.trim() === '' || !Number.isFinite(parsed)) return null;

  return Math.min(max, Math.max(min, parsed));
};

type NumFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

const NumField: FC<NumFieldProps> = (props) => {
  const { label, value, min, max, onChange } = props;
  const { t } = useTranslation('ItemPane');

  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText(String(value));
  }, [value]);

  const stepRef = useRef<(delta: number) => void>(() => {});

  const apply = (next: number) => {
    setText(String(next));
    if (next !== value) {
      onChange(next);
    }
  };

  const step = (delta: number) => {
    apply(Math.min(max, Math.max(min, value + delta)));
  };
  stepRef.current = step;

  const boxRef = useRef<HTMLDivElement | null>(null);

  // ホイールで値を加減する（ページのスクロールはさせない）。
  // React の onWheel は passive のため、非 passive で native 登録する。
  useEffect(() => {
    const el = boxRef.current;
    if (el === null) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stepRef.current(e.deltaY < 0 ? 1 : -1);
    };
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  const commit = () => {
    const parsed = clampInt(text, min, max);
    if (parsed === null) {
      setText(String(value));

      return;
    }
    apply(parsed);
  };

  // 青い配置ボタン(MUI small ≒ 30px)と同じ高さを確保する
  const stepButtonSx = {
    width: 22,
    height: 30,
    fontSize: 15,
    lineHeight: 1,
    minWidth: 0,
    p: 0,
    color: 'text.secondary',
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Box
        ref={boxRef}
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          border: 1,
          borderColor: 'rgba(0, 0, 0, 0.23)',
          borderRadius: 1,
          bgcolor: 'transparent',
        }}
        title={t('spinbox_wheel_tooltip')}
      >
        <Typography
          sx={{
            position: 'absolute',
            top: -7,
            left: 6,
            px: 0.5,
            bgcolor: '#fff',
            fontSize: 11,
            lineHeight: 1.2,
            color: 'text.secondary',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </Typography>
        <IconButton
          size="small"
          sx={stepButtonSx}
          onClick={() => {
            step(-1);
          }}
          aria-label={`${label} -1`}
        >
          −
        </IconButton>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              step(1);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              step(-1);
            }
          }}
          inputMode="numeric"
          style={{
            width: 34,
            textAlign: 'center',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 15,
            padding: '6px 0',
            color: 'inherit',
          }}
        />
        <IconButton
          size="small"
          sx={stepButtonSx}
          onClick={() => {
            step(1);
          }}
          aria-label={`${label} +1`}
        >
          +
        </IconButton>
      </Box>
    </Box>
  );
};

// ---- 備品の形状プレビュー（高さ・幅に即時追従） ----
// BAAS版と同じ実装：固定サイズの正方形枠の中に形状を描く。
// セルの辺長は最長辺に合わせて縮むので、枠の幅は形状が変わっても固定。

type ShapePreviewProps = {
  height: number;
  width: number;
  color: string;
};

const SHAPE_SIDE = 34; // BAAS版(26px)より一回り大きい
const SHAPE_PAD = 2;
const SHAPE_GAP = 1;

const ShapePreview: FC<ShapePreviewProps> = (props) => {
  const { height, width, color } = props;
  // 横向き優先（BAAS版と同じ）：行数=min(高,幅)、列数=max(高,幅)
  const rows = Math.max(1, Math.min(height, width));
  const cols = Math.max(1, Math.max(height, width));
  const span = Math.max(rows, cols);
  const cell = Math.max(
    1,
    (SHAPE_SIDE - 2 * SHAPE_PAD - (span - 1) * SHAPE_GAP) / span,
  );
  const gridW = cols * cell + (cols - 1) * SHAPE_GAP;
  const gridH = rows * cell + (rows - 1) * SHAPE_GAP;
  const x0 = (SHAPE_SIDE - gridW) / 2;
  const y0 = (SHAPE_SIDE - gridH) / 2;

  return (
    <Box
      sx={{
        width: SHAPE_SIDE,
        height: SHAPE_SIDE,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => (
          <Box
            key={`shape-${r}-${c}`}
            sx={{
              position: 'absolute',
              left: x0 + c * (cell + SHAPE_GAP),
              top: y0 + r * (cell + SHAPE_GAP),
              width: cell,
              height: cell,
              bgcolor: color,
              border: '1px solid rgba(0, 0, 0, 0.45)',
              boxSizing: 'border-box',
            }}
          />
        )),
      )}
    </Box>
  );
};

type Props = {
  itemSet: ItemSet;
  placedItems: PlacedItem[];
  showProb: boolean;
  onToggleShowProb: () => void;
  onModifyItem: (item: ItemSet) => void;
  onAddPlacedItem: (item: PlacedItem) => void;
};

const PlacementShapeIcon: FC<{
  orientation: 'vertical' | 'horizontal' | 'square';
}> = ({ orientation }) => {
  // 線幅を含めた外寸を縦10×20、横20×10、正方形16×16に揃える。
  const width =
    orientation === 'square' ? 14 : orientation === 'vertical' ? 8 : 18;
  const height =
    orientation === 'square' ? 14 : orientation === 'vertical' ? 18 : 8;

  return (
    <SvgIcon>
      <rect
        x={(24 - width) / 2}
        y={(24 - height) / 2}
        width={width}
        height={height}
        rx={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      />
    </SvgIcon>
  );
};

const ItemPane: FC<Props> = (props) => {
  const {
    itemSet,
    placedItems,
    showProb,
    onToggleShowProb,
    onModifyItem,
    onAddPlacedItem,
  } = props;

  const { t } = useTranslation('ItemPane');
  const groupIndex = itemSet.item.index - 1;
  const palette = getItemPalette(itemSet.item.index);

  const [heightValue, setHeightValue] = useState(itemSet.item.height);
  const [widthValue, setWidthValue] = useState(itemSet.item.width);

  useEffect(() => {
    setHeightValue(itemSet.item.height);
  }, [itemSet.item.height]);
  useEffect(() => {
    setWidthValue(itemSet.item.width);
  }, [itemSet.item.width]);

  const commitHeight = (value: number) => {
    setHeightValue(value);
    if (value !== itemSet.item.height) {
      onModifyItem({
        item: { ...itemSet.item, height: value },
        count: itemSet.count,
      });
    }
  };

  const commitWidth = (value: number) => {
    setWidthValue(value);
    if (value !== itemSet.item.width) {
      onModifyItem({
        item: { ...itemSet.item, width: value },
        count: itemSet.count,
      });
    }
  };

  const commitCount = (value: number) => {
    if (value !== itemSet.count) {
      onModifyItem({
        item: itemSet.item,
        count: value,
      });
    }
  };

  // ---- お気に入り ----

  const [favorites, setFavorites] = useState<SizeFavorite[]>(() =>
    loadFavorites(groupIndex),
  );

  const addFavorite = () => {
    const favorite = { h: itemSet.item.height, w: itemSet.item.width };
    const exists = favorites.some(
      (f) =>
        (f.h === favorite.h && f.w === favorite.w) ||
        (f.h === favorite.w && f.w === favorite.h),
    );
    if (exists) return;
    const next = sortFavorites([...favorites, favorite]);
    setFavorites(next);
    saveFavorites(groupIndex, next);
  };

  const removeFavorite = (favorite: SizeFavorite) => {
    const next = favorites.filter((f) => f !== favorite);
    setFavorites(next);
    saveFavorites(groupIndex, next);
  };

  const applyFavorite = (favorite: SizeFavorite) => {
    onModifyItem({
      item: { ...itemSet.item, height: favorite.h, width: favorite.w },
      count: itemSet.count,
    });
  };

  const { startPlaceSelect } = usePlaceSelectHelper();

  return (
    <Card>
      <Box
        px={1.5}
        py={1.5}
        display="grid"
        gridTemplateColumns="auto auto"
        columnGap={2}
        rowGap={1.5}
        alignItems="start"
      >
        {/* 左上: 確率表示切替（枠付き。名称はグループ色＋形状プレビュー） */}
        <Tooltip title={t('show_prob_toggle_tooltip')}>
          <Box
            onClick={onToggleShowProb}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1,
              alignSelf: 'stretch',
              border: 1,
              borderRadius: 1,
              borderColor: showProb
                ? 'primary.main'
                : 'rgba(0, 0, 0, 0.23)',
              bgcolor: showProb ? 'rgba(25, 118, 210, 0.06)' : 'transparent',
              opacity: showProb ? 1 : 0.55,
              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.12)' },
            }}
          >
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              {t('show_prob_label')}
            </Typography>
            <Typography
              sx={{
                color: palette[700],
                fontWeight: 600,
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
              }}
            >
              {`${t('card_header_title')} ${itemSet.item.index}`}
            </Typography>
            <Box title={`${heightValue}x${widthValue}`}>
              <ShapePreview
                height={heightValue}
                width={widthValue}
                color={palette[300]}
              />
            </Box>
          </Box>
        </Tooltip>

        {/* 右上: 格子設定（横並び、上にラベル） */}
        <Box display="flex" alignItems="flex-start" gap={1.5}>
          <Tooltip title={t('height_input_tooltip')}>
            <Box>
              <NumField
                label={t('height')}
                value={heightValue}
                min={1}
                max={4}
                onChange={commitHeight}
              />
            </Box>
          </Tooltip>
          <Tooltip title={t('width_input_tooltip')}>
            <Box>
              <NumField
                label={t('width')}
                value={widthValue}
                min={1}
                max={4}
                onChange={commitWidth}
              />
            </Box>
          </Tooltip>
          <Tooltip title={t('amount_input_tooltip')}>
            <Box>
              <NumField
                label={t('amount')}
                value={itemSet.count}
                min={0}
                max={7}
                onChange={commitCount}
              />
            </Box>
          </Tooltip>
        </Box>

        {/* 左下: 配置ボタン（縦積み。列幅=最も長いボタンに揃う） */}
        {/* 列幅は最長の英語ラベル（Add (Horizontal)）に合わせて固定 */}
        <Box
          display="flex"
          flexDirection="column"
          gap={1}
          alignItems="stretch"
          sx={{ width: 168 }}
        >
          <Tooltip title={t('add_button_tooltip.0')}>
            <Button
              variant="contained"
              size="small"
              startIcon={
                <PlacementShapeIcon
                  orientation={
                    isSquare(itemSet.item) ? 'square' : 'vertical'
                  }
                />
              }
              onClick={(e) => {
                const newPlacedItem: PlacedItem = {
                  item: itemSet.item,
                  rotated:
                    !isSquare(itemSet.item) && !isVertical(itemSet.item),
                  row: 1,
                  col: 1,
                  id: crypto.randomUUID(),
                };
                startPlaceSelect(newPlacedItem, {
                  baseEvent: e.nativeEvent,
                  onSelect: (placedItem) => {
                    onAddPlacedItem(placedItem);
                  },
                });
              }}
              disabled={placedItems.length >= itemSet.count}
            >
              {t('add_button_tooltip.1')}
              {!isSquare(itemSet.item) ? t('add_button_tooltip.2') : ''}
            </Button>
          </Tooltip>
          {!isSquare(itemSet.item) && (
            <Tooltip title={t('add_button_tooltip.0')}>
              <Button
                variant="contained"
                size="small"
                startIcon={<PlacementShapeIcon orientation="horizontal" />}
                onClick={(e) => {
                  const newPlacedItem: PlacedItem = {
                    item: itemSet.item,
                    rotated: isVertical(itemSet.item),
                    row: 1,
                    col: 1,
                    id: crypto.randomUUID(),
                  };
                  startPlaceSelect(newPlacedItem, {
                    baseEvent: e.nativeEvent,
                    onSelect: (placedItem) => {
                      onAddPlacedItem(placedItem);
                    },
                  });
                }}
                disabled={placedItems.length >= itemSet.count}
              >
                {t('add_button_tooltip.1')}
                {t('add_button_tooltip.3')}
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* 右下: お気に入り（上寄せ、最大2行）＋操作説明 */}
        <Box
          display="flex"
          flexDirection="column"
          gap={0.75}
          alignItems="flex-start"
          alignSelf="flex-start"
        >
          <Box display="flex" alignItems="center" flexWrap="wrap" gap={0.5}>
            <Tooltip title={t('save_size_tooltip')}>
              <IconButton size="small" onClick={addFavorite}>
                <AddCircleOutlineIcon />
              </IconButton>
            </Tooltip>
            {favorites.map((favorite) => (
              <Tooltip
                key={`favorite-${favorite.h}-${favorite.w}`}
                title={t('favorite_apply_tooltip', {
                  size: `${Math.max(favorite.h, favorite.w)}x${Math.min(favorite.h, favorite.w)}`,
                })}
              >
                <Chip
                  label={`${Math.max(favorite.h, favorite.w)}x${Math.min(favorite.h, favorite.w)}`}
                  size="small"
                  onClick={() => {
                    applyFavorite(favorite);
                  }}
                  onDelete={() => {
                    removeFavorite(favorite);
                  }}
                />
              </Tooltip>
            ))}
          </Box>
          {/* 履歴チップの直下。width 0 + minWidth 100% で
              トラック幅の計算に寄与せず、列幅に収めて折り返す */}
          <Typography
            sx={{
              fontSize: 11,
              lineHeight: 1.5,
              color: 'text.secondary',
              width: 0,
              minWidth: '100%',
              overflowWrap: 'anywhere',
            }}
          >
            {t('gesture_hint')}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default ItemPane;

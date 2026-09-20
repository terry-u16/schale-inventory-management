import { useLayoutEffect, useRef, useState, type FC } from 'react';
import { Box, Paper } from '@mui/material';
import CoverButton from './Cover';
import { type Cover } from './Cover';
import {
  type PlacedItem,
  getRotatedHeight,
  getRotatedWidth,
  BOARD_ROWS,
  BOARD_COLS,
  coversOpenedCells,
  overlapsOthers,
  findSmartPlacement,
} from './ItemPane';
import { useOverlayContext } from './OverlayProvider';
import { usePlaceSelectHelper } from './PlaceSelectHelper';
import PlacedItemSquare from './PlacedItemSquare';
import './Board.css';

/** ドラッグとみなすまでの移動量（px）。 */
const DRAG_THRESHOLD_PX = 6;
/** ダブルタップ削除とみなす間隔（ms）。 */
const DOUBLE_TAP_MS = 350;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

interface BoardRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Props {
  placedItems: PlacedItem[];
  probs: number[][] | null;
  openMap: boolean[];
  showProb: boolean[];
  probScale: 'max' | 'minmax';
  /** 表示中のprobsが最新入力の計算結果か（falseの間は最高確率枠を消す） */
  probsFresh: boolean;
  onToggleOpen: (idx: number) => void;
  onMovePlacedItem: (item: PlacedItem, row: number, col: number) => void;
  onRotatePlacedItem: (item: PlacedItem) => void;
  onRemovePlacedItem: (item: PlacedItem) => void;
}

interface DragState {
  item: PlacedItem;
  offsetRow: number;
  offsetCol: number;
  startX: number;
  startY: number;
  active: boolean;
  /** ドラッグ開始時の盤面矩形。移動中の再取得を省く（ドラッグ中は動かない） */
  boardRect: BoardRect;
}

interface DragGhost {
  item: PlacedItem;
  valid: boolean;
}

const Board: FC<Props> = (props) => {
  const {
    placedItems,
    probs,
    openMap,
    showProb,
    probScale,
    probsFresh,
    onToggleOpen,
    onMovePlacedItem,
    onRotatePlacedItem,
    onRemovePlacedItem,
  } = props;

  // 注目しているアイテムの組合せフラグ
  // 備品1, 2, 3に対して、それぞれ確率計算時に考慮するか（2^3通り）を表す
  let probFlag = 0;

  for (let i = 0; i < showProb.length; i++) {
    if (showProb[i]) {
      probFlag |= 1 << i;
    }
  }

  if (probs === null) {
    probFlag = 0;
  }

  const targetProbs = probs?.[probFlag] ?? Array<number>(45).fill(0.0);

  // 最大確率を探す
  let maxProb = -Infinity;

  for (let i = 0; i < targetProbs.length; i++) {
    if (!openMap[i] && targetProbs[i] !== 0 && targetProbs[i] > maxProb) {
      maxProb = targetProbs[i];
    }
  }

  // min-max 正規化用のレンジ（開けていないマスが対象）
  let minProb = Infinity;
  let rangeMax = -Infinity;

  if (probScale === 'minmax') {
    for (let i = 0; i < targetProbs.length; i++) {
      if (!openMap[i]) {
        minProb = Math.min(minProb, targetProbs[i]);
        rangeMax = Math.max(rangeMax, targetProbs[i]);
      }
    }
    if (!Number.isFinite(minProb) || rangeMax <= minProb) {
      minProb = 0;
      rangeMax = 1;
    }
  }

  const scaleProb = (prob: number) => {
    if (probScale === 'minmax') {
      return clamp(0.2 + (0.8 * (prob - minProb)) / (rangeMax - minProb), 0, 1);
    }

    return maxProb > 0 ? clamp(prob / maxProb, 0, 1) : 0;
  };

  // 最高確率マスは「表示している確率そのもの」からその場で決める。
  // 対象: 未オープン かつ 備品が覆っていないマス（覆いの下は見えないため）。
  const covered = new Set<number>();
  for (const placed of placedItems) {
    const h = getRotatedHeight(placed);
    const w = getRotatedWidth(placed);
    for (let r = placed.row; r < placed.row + h; r++) {
      for (let c = placed.col; c < placed.col + w; c++) {
        covered.add((r - 1) * BOARD_COLS + (c - 1));
      }
    }
  }

  let bestProb = 0;

  for (let i = 0; i < targetProbs.length; i++) {
    if (!openMap[i] && !covered.has(i) && targetProbs[i] > bestProb) {
      bestProb = targetProbs[i];
    }
  }

  const covers: Cover[] = targetProbs.map((prob: number, index: number) => ({
    row: Math.floor(index / 9) + 1,
    col: (index % 9) + 1,
    open: openMap[index],
    prob,
    probFlag,
    isBest:
      probsFresh &&
      !openMap[index] &&
      !covered.has(index) &&
      prob > 0 &&
      prob === bestProb,
    colorValue: scaleProb(prob),
  }));

  const { visible: overlayVisible, setMask, removeMask } = useOverlayContext();
  const refFirstCoverButtonRoot = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const boardContainer = document.getElementById('board-container');
    const overlay = document.getElementById('overlay');
    if (boardContainer === null || overlay === null) return;
    const updateMask = () => {
      const boardContainerRect = boardContainer.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();
      if (refFirstCoverButtonRoot.current === null)
        throw new Error('firstCoverButtonRoot element not found');
      const firstCoverButtonRootRect =
        refFirstCoverButtonRoot.current.getBoundingClientRect();
      setMask('board', {
        x: firstCoverButtonRootRect.left - overlayRect.left,
        y: boardContainerRect.top - overlayRect.top,
        width: boardContainerRect.width,
        height: boardContainerRect.height,
        margin: 5,
      });
    };
    updateMask();
    const resizeObserver = new ResizeObserver(updateMask);
    resizeObserver.observe(boardContainer);
    window.addEventListener('resize', updateMask);

    return () => {
      removeMask('board');
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateMask);
    };
  }, [overlayVisible, setMask, removeMask]);
  const { placeSelecting, selectingPlacedItem, setSelectingPlace } =
    usePlaceSelectHelper();

  // ---- 盤面直接操作（ドラッグ移動・タップ回転・ダブルタップ削除） ----

  const dragRef = useRef<DragState | null>(null);
  const [dragGhost, setDragGhost] = useState<DragGhost | null>(null);
  const suppressClickRef = useRef(false);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  const cellFromRect = (
    clientX: number,
    clientY: number,
    rect: BoardRect,
  ): { row: number; col: number } | null => {
    const col = Math.floor(((clientX - rect.left) / rect.width) * BOARD_COLS);
    const row = Math.floor(((clientY - rect.top) / rect.height) * BOARD_ROWS);
    if (row < 0 || col < 0 || row >= BOARD_ROWS || col >= BOARD_COLS) {
      return null;
    }

    return { row: row + 1, col: col + 1 };
  };

  const cellFromEvent = (
    clientX: number,
    clientY: number,
  ): { row: number; col: number } | null => {
    const boardContainer = document.getElementById('board-container');
    if (boardContainer === null) return null;

    return cellFromRect(clientX, clientY, boardContainer.getBoundingClientRect());
  };

  const itemAt = (row: number, col: number): PlacedItem | null => {
    for (let i = placedItems.length - 1; i >= 0; i--) {
      const item = placedItems[i];
      const h = getRotatedHeight(item);
      const w = getRotatedWidth(item);
      if (
        row >= item.row &&
        row < item.row + h &&
        col >= item.col &&
        col < item.col + w
      ) {
        return item;
      }
    }

    return null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (placeSelecting || e.button !== 0) return;
    const boardContainer = document.getElementById('board-container');
    if (boardContainer === null) return;
    const boardRect = boardContainer.getBoundingClientRect();
    const cell = cellFromRect(e.clientX, e.clientY, boardRect);
    if (cell === null) return;
    const target = itemAt(cell.row, cell.col);
    if (target === null) return;

    suppressClickRef.current = true;
    dragRef.current = {
      item: target,
      offsetRow: cell.row - target.row,
      offsetCol: cell.col - target.col,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
      boardRect: {
        left: boardRect.left,
        top: boardRect.top,
        width: boardRect.width,
        height: boardRect.height,
      },
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag === null) return;

    if (
      !drag.active &&
      Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) <
        DRAG_THRESHOLD_PX
    ) {
      return;
    }
    drag.active = true;

    const cell = cellFromRect(e.clientX, e.clientY, drag.boardRect);
    if (cell === null) return;

    const h = getRotatedHeight(drag.item);
    const w = getRotatedWidth(drag.item);
    const row = clamp(cell.row - drag.offsetRow, 1, BOARD_ROWS - h + 1);
    const col = clamp(cell.col - drag.offsetCol, 1, BOARD_COLS - w + 1);

    setDragGhost({
      item: { ...drag.item, row, col },
      valid:
        !overlapsOthers(drag.item, row, col, placedItems) &&
        !coversOpenedCells(drag.item, row, col, openMap),
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;

    if (drag === null) return;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (drag.active) {
      // ゴーストは即座に消す（1フレームのちらつきを防ぐ）。
      // クリック抑止だけ次のティックで解除する。
      setDragGhost(null);
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      if (dragGhost === null) return;

      const { item, valid } = dragGhost;
      if (!valid) {
        // 置けない場所で離した場合は元の位置のまま何もしない
        return;
      }
      if (item.row !== drag.item.row || item.col !== drag.item.col) {
        onMovePlacedItem(drag.item, item.row, item.col);
      }

      return;
    }

    // タップ: 備品の回転。高速なダブルタップは削除。
    const now = Date.now();
    if (
      lastTapRef.current !== null &&
      lastTapRef.current.id === drag.item.id &&
      now - lastTapRef.current.time < DOUBLE_TAP_MS
    ) {
      lastTapRef.current = null;
      suppressClickRef.current = false;
      setDragGhost(null);
      onRemovePlacedItem(drag.item);

      return;
    }
    lastTapRef.current = { id: drag.item.id, time: now };
    suppressClickRef.current = false;
    setDragGhost(null);
    onRotatePlacedItem(drag.item);
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const onContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (placeSelecting) return;
    const cell = cellFromEvent(e.clientX, e.clientY);
    if (cell === null) return;

    const target = itemAt(cell.row, cell.col);
    if (target !== null) {
      onRemovePlacedItem(target);

      return;
    }
    const idx = (cell.row - 1) * BOARD_COLS + (cell.col - 1);
    if (openMap[idx]) {
      onToggleOpen(idx);
    }
  };

  return (
    <>
      <Paper>
        <Box p={1.5}>
          <div
            id="board-container"
            style={{ touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClickCapture={onClickCapture}
            onContextMenu={onContextMenu}
          >
            {(() => {
              // グループ内の通し番号を左上に表示する（BAAS版の番号札と同じ）
              const counters: Record<number, number> = {};

              return placedItems.map((placedItem: PlacedItem) => {
                counters[placedItem.item.index] =
                  (counters[placedItem.item.index] ?? 0) + 1;

                return (
                  <PlacedItemSquare
                    key={`placed-item-square-${placedItem.id}`}
                    placedItem={placedItem}
                    pointerEvents="none"
                    label={`${counters[placedItem.item.index]}`}
                  />
                );
              });
            })()}
            {dragGhost !== null ? (
              <PlacedItemSquare
                placedItem={dragGhost.item}
                pointerEvents="none"
                invalid={!dragGhost.valid}
              />
            ) : null}
            {covers.map((cover: Cover, idx: number) => (
              <CoverButton
                cover={cover}
                key={`cover${cover.row}-${cover.col}`}
                onClick={() => {
                  onToggleOpen(idx);
                }}
                onMouseEnter={() => {
                  setSelectingPlace(cover.row, cover.col);
                }}
                onMouseLeave={() => {
                  setSelectingPlace(-1, -1);
                }}
                disabled={placeSelecting}
                {...(idx === 0 ? { elementRef: refFirstCoverButtonRoot } : {})}
              />
            ))}
            {(() => {
              // 配置モード中のホバー: スマート配置の実際の落下地点を虚影で示す。
              // 角・隅でも「クリックすればどこに置かれるか」が分かる。
              // どこにも置けない形状のときだけ、ホバー位置に無効（赤破線）を示す。
              if (selectingPlacedItem === null) return null;

              const anchor = findSmartPlacement(
                selectingPlacedItem,
                selectingPlacedItem.row,
                selectingPlacedItem.col,
                placedItems,
                openMap,
              );

              return (
                <PlacedItemSquare
                  placedItem={
                    anchor !== null
                      ? {
                          ...selectingPlacedItem,
                          row: anchor.row,
                          col: anchor.col,
                        }
                      : selectingPlacedItem
                  }
                  pointerEvents="none"
                  invalid={anchor === null}
                />
              );
            })()}
          </div>
        </Box>
      </Paper>
    </>
  );
};

export default Board;

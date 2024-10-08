import { useLayoutEffect, useRef, type FC } from 'react';
import { Box, Paper } from '@mui/material';
import CoverButton from './Cover';
import { type Cover } from './Cover';
import { type PlacedItem } from './ItemPane';
import { useOverlayContext } from './OverlayProvider';
import { usePlaceSelectHelper } from './PlaceSelectHelper';
import PlacedItemSquare from './PlacedItemSquare';
import './Board.css';

export interface Props {
  placedItems: PlacedItem[];
  probs: number[][] | null;
  isMaxProbs: boolean[][] | null;
  openMap: boolean[];
  showProb: boolean[];
  onToggleOpen: (idx: number) => void;
}

const Board: FC<Props> = (props) => {
  const { placedItems, probs, isMaxProbs, openMap, showProb, onToggleOpen } =
    props;

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
  const targetIsMaxProbs =
    isMaxProbs?.[probFlag] ?? Array<boolean>(45).fill(false);

  // 最大確率を探す
  let maxProb = -Infinity;

  for (let i = 0; i < targetProbs.length; i++) {
    if (!openMap[i] && targetProbs[i] !== 0 && targetProbs[i] > maxProb) {
      maxProb = targetProbs[i];
    }
  }

  const covers: Cover[] = targetProbs.map((prob: number, index: number) => ({
    row: Math.floor(index / 9) + 1,
    col: (index % 9) + 1,
    open: openMap[index],
    prob,
    probFlag,
    isBest: !openMap[index] && targetIsMaxProbs[index],
    maxProb,
  }));

  const { setMask, removeMask } = useOverlayContext();
  const refFirstCoverButtonRoot = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const boardContainer = document.getElementById('board-container');
    if (boardContainer === null) return;
    const updateMask = () => {
      const boardContainerRect = boardContainer.getBoundingClientRect();
      if (refFirstCoverButtonRoot.current === null)
        throw new Error('firstCoverButtonRoot element not found');
      const offsetLeft =
        refFirstCoverButtonRoot.current.getBoundingClientRect().left -
        boardContainerRect.left;
      setMask('board', {
        x: boardContainer.offsetLeft + offsetLeft,
        y: boardContainer.offsetTop,
        width: 70 * 9,
        height: boardContainer.offsetHeight,
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
  }, [setMask, removeMask]);
  const { placeSelecting, selectingPlacedItem, setSelectingPlace } =
    usePlaceSelectHelper();

  return (
    <>
      <Paper>
        <Box py={3}>
          <div id="board-container">
            {placedItems.map((placedItem: PlacedItem) => (
              <PlacedItemSquare
                key={`placed-item-square-${placedItem.id}`}
                placedItem={placedItem}
                pointerEvents="none"
              />
            ))}
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
            {selectingPlacedItem !== null ? (
              <PlacedItemSquare
                placedItem={selectingPlacedItem}
                pointerEvents="none"
              />
            ) : null}
          </div>
        </Box>
      </Paper>
    </>
  );
};

export default Board;

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
  openMap: boolean[];
  showProb: boolean[];
  onToggleOpen: (idx: number) => void;
}

const Board: FC<Props> = (props) => {
  const { placedItems, probs, openMap, showProb, onToggleOpen } = props;

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

  // 小数点第一位まで見て、最大値に一致するものにフラグを付けたい
  const roundProb = (prob: number) => Math.round(prob * 1000) / 1000;
  let roundedMax = 0;
  let maxProb = -Infinity;

  for (let i = 0; i < targetProbs.length; i++) {
    const rounded = roundProb(targetProbs[i]);
    if (!openMap[i] && rounded > roundedMax) {
      roundedMax = rounded;
    }
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
    isBest: !openMap[index] && prob > 0 && roundProb(prob) === roundedMax,
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

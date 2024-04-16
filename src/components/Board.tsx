import { type FC } from 'react';
import { Box, Paper } from '@mui/material';
import CoverButton from './Cover';
import { type Cover } from './Cover';
import './Board.css';
import { type PlacedItem } from './ItemPane';
import PlacedItemSquare from './PlacedItemSquare';

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

  for (let i = 0; i < targetProbs.length; i++) {
    const rounded = roundProb(targetProbs[i]);
    if (!openMap[i] && rounded > roundedMax) {
      roundedMax = rounded;
    }
  }

  const covers: Cover[] = targetProbs.map((prob: number, index: number) => ({
    row: Math.floor(index / 9) + 1,
    col: (index % 9) + 1,
    open: openMap[index],
    prob,
    probFlag,
    isBest: !openMap[index] && prob > 0 && roundProb(prob) === roundedMax,
    maxProb: Math.max(...targetProbs.filter((n) => n !== 0)),
    minProb: Math.min(...targetProbs.filter((n) => n !== 0)),
  }));

  return (
    <>
      <Paper>
        <Box py={3}>
          <div id="board-container">
            {placedItems.map((placedItem: PlacedItem) => (
              <PlacedItemSquare
                key={`placed-item-square-${placedItem.id}`}
                placedItem={placedItem}
              />
            ))}
            {covers.map((cover: Cover, idx: number) => (
              <CoverButton
                cover={cover}
                key={`cover${cover.row}-${cover.col}`}
                onClick={() => {
                  onToggleOpen(idx);
                }}
              />
            ))}
          </div>
        </Box>
      </Paper>
    </>
  );
};

export default Board;

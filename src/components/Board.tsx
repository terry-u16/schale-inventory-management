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

  const targetProbs = probs?.[probFlag] ?? Array(45).fill(0.0);

  const covers: Cover[] = targetProbs.map((prob: number, index: number) => ({
    row: Math.floor(index / 9) + 1,
    col: (index % 9) + 1,
    open: openMap[index],
    prob,
    probFlag,
  }));

  return (
    <>
      <Paper>
        <Box py={5}>
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

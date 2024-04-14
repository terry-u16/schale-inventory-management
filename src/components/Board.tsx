import { type FC, useState } from 'react';
import { Box, Paper } from '@mui/material';
import CoverButton from './Cover';
import { type Cover } from './Cover';
import './Board.css';
import { type PlacedItem } from './ItemPane';
import PlacedItemSquare from './PlacedItemSquare';

export interface Props {
  placedItems: PlacedItem[];
}

const Board: FC<Props> = (props) => {
  const { placedItems } = props;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const initCovers: Cover[] = [...Array(5)]
    .map((_: undefined, row: number) =>
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */ [
        ...Array(9),
      ].map((_: undefined, col: number) => ({
        row: row + 1,
        col: col + 1,
        open: false,
      })),
    )
    .flat();

  const [covers, setCovers] = useState(initCovers);

  const coverOnClick = (idx: number) => {
    setCovers((prevCovers) => {
      const newCovers = [...prevCovers];
      newCovers[idx].open = !newCovers[idx].open;

      return newCovers;
    });
  };

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
                  coverOnClick(idx);
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

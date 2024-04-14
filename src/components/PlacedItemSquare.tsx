import { type FC } from 'react';
import { ThemeProvider } from '@mui/material';
import Box from '@mui/material/Box';
import { getItemColor, type PlacedItem } from './ItemPane';
import { getRotatedHeight, getRotatedWidth } from './ItemPane';

export interface Props {
  placedItem: PlacedItem;
}

const styleGenerator = (item: PlacedItem) => ({
  opacity: 0.5,
  gridRow: `${item.row} / ${item.row + getRotatedHeight(item)}`,
  gridColumn: `${item.col} / ${item.col + getRotatedWidth(item)}`,
});

const PlacedItemSquare: FC<Props> = (props) => {
  const { placedItem } = props;

  return (
    <>
      <ThemeProvider
        theme={{
          palette: {
            primary: {
              main: getItemColor(placedItem.item.index),
            },
          },
        }}
      >
        <Box
          style={styleGenerator(placedItem)}
          sx={{ borderRadius: 1, bgcolor: 'primary.main' }}
        />
      </ThemeProvider>
    </>
  );
};

export default PlacedItemSquare;

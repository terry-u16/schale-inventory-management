import { type FC } from 'react';
import { ThemeProvider } from '@mui/material';
import Box from '@mui/material/Box';
import { getItemPalette, type PlacedItem } from './ItemPane';
import { getRotatedHeight, getRotatedWidth } from './ItemPane';

export interface Props {
  placedItem: PlacedItem;
}

const styleGenerator = (item: PlacedItem) => ({
  opacity: 0.6,
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
              main: getItemPalette(placedItem.item.index)[400],
              light: getItemPalette(placedItem.item.index)[300],
              dark: getItemPalette(placedItem.item.index)[800],
            },
          },
        }}
      >
        <Box
          style={styleGenerator(placedItem)}
          sx={{
            borderRadius: 1,
            border: 1,
            borderColor: 'primary.dark',
            bgcolor: 'primary.light',
          }}
        />
      </ThemeProvider>
    </>
  );
};

export default PlacedItemSquare;

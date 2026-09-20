import { memo, type FC } from 'react';
import { ThemeProvider } from '@mui/material';
import Box from '@mui/material/Box';
import { getItemPalette, type PlacedItem } from './ItemPane';
import { getRotatedHeight, getRotatedWidth } from './ItemPane';

export interface Props {
  placedItem: PlacedItem;
  pointerEvents?: 'none' | 'auto';
  /** ドラッグ中のゴーストが不正な位置（他の備品と重なる）のとき true。 */
  invalid?: boolean;
  /** 左上隅に表示する備品の番号（グループ内の順序）。 */
  label?: string;
}

// 備品は「1つの形状色块」として描く：セルより手前(zIndex)に置き、
// 外周を濃い2pxで強調する。セル（確率ボタン）は色块の下に沈む。
const styleGenerator = (item: PlacedItem, invalid: boolean) => ({
  gridRow: `${item.row} / ${item.row + getRotatedHeight(item)}`,
  gridColumn: `${item.col} / ${item.col + getRotatedWidth(item)}`,
  ...(invalid
    ? {
        opacity: 0.8,
        zIndex: 2,
        border: '2px dashed #ef5350',
        background: '#ffcdd2',
      }
    : {
        zIndex: 1,
      }),
});

const PlacedItemSquare: FC<Props> = (props) => {
  const { placedItem, invalid = false, label } = props;

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
          style={styleGenerator(placedItem, invalid)}
          sx={{
            position: 'relative',
            bgcolor: 'primary.light',
            border: invalid ? 0 : 3,
            borderColor: 'primary.dark',
            boxShadow: invalid ? undefined : '0 0 0 1px rgba(0,0,0,0.35)',
            pointerEvents: props.pointerEvents,
          }}
        >
          {label !== undefined && !invalid ? (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                px: 0.5,
                bgcolor: '#ffffff',
                border: '1px solid rgba(48, 48, 48, 0.6)',
                borderTop: 'none',
                borderLeft: 'none',
                borderBottomRightRadius: '6px',
                fontSize: 13,
                lineHeight: 1.5,
                fontWeight: 700,
                color: '#303030',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {label}
            </Box>
          ) : null}
        </Box>
      </ThemeProvider>
    </>
  );
};

export default memo(PlacedItemSquare);

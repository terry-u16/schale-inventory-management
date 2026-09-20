import { memo, type FC } from 'react';
import { Box } from '@mui/material';
import {
  blueGrey,
  lightBlue,
  lightGreen,
  orange,
  purple,
  red,
  yellow,
} from '@mui/material/colors';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';

export interface Cover {
  row: number;
  col: number;
  open: boolean;
  prob: number;
  probFlag: number;
  isBest: boolean;
  /** 配色に使う 0..1 に正規化済みの値（Board がスケール方式に応じて計算する）。 */
  colorValue: number;
}

type Props = {
  cover: Cover;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
  disabled?: boolean;
  elementRef?: React.RefObject<HTMLDivElement>;
};

const boxStyleGenerator = (row: number, col: number) => ({
  gridRow: row,
  gridColumn: col,
});

// 最高確率マスは4pxの青枠。ピンクのヒートマップ上で一目で分かり、
// クリック後のフォーカスリング（黒）と混同されないようにする。
const BEST_BORDER = '4px solid #1565c0';

const buttonStyleGenerator = (opacity: number, isBest: boolean) => {
  return {
    opacity,
    width: '100%',
    height: '100%',
    boxSizing: 'border-box' as const,
    border: isBest ? BEST_BORDER : '1px solid #bdbdbd',
  };
};

const CoverButton: FC<Props> = (props) => {
  const { row, col, open, prob, probFlag, isBest, colorValue } = props.cover;
  const { t } = useTranslation('MainArea');
  const opacity = open ? 0.1 : 1;

  // 開けたマスには「空」を表示する（BAAS版と同じ）。
  // 確率0.0%の薄い数値の代わりに意味のある表示にする
  const probText = open
    ? t('opened_cell')
    : probFlag > 0
      ? `${(Math.round(prob * 1000) / 10).toFixed(1)}%`
      : '';
  const colorPalette = [
    blueGrey[300],
    red[300],
    yellow[300],
    orange[300],
    lightBlue[300],
    purple[300],
    lightGreen[300],
    '#f889da',
  ];

  const generateColor = (probFlag: number, value: number) => {
    if (probFlag === 0) {
      return blueGrey[100];
    }

    let s = '#';
    const baseColor = colorPalette[probFlag];

    for (let i = 0; i < 3; i++) {
      const v = parseInt(baseColor.substring(1 + i * 2, 3 + i * 2), 16);
      const c = Math.floor(v * value + 255 * (1 - value));
      s += c.toString(16).padStart(2, '0');
    }

    return s;
  };

  const color = generateColor(probFlag, colorValue);
  const theme = createTheme({
    palette: {
      primary: {
        main: color,
      },
    },
  });

  return (
    <>
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onMouseEnter={props.onMouseEnter}
          onMouseLeave={props.onMouseLeave}
          style={boxStyleGenerator(row, col)}
          ref={props.elementRef}
        >
          <Button
            variant="contained"
            key={`cover${row}-${col}`}
            onClick={props.onClick}
            sx={{
              pointerEvents: props.disabled === true ? 'none' : 'auto',
              '&.Mui-focusVisible': { outline: 'none' },
              '&:focus-visible': { outline: 'none' },
            }}
            style={buttonStyleGenerator(opacity, isBest)}
            disableElevation
          >
            {probText}
          </Button>
        </Box>
      </ThemeProvider>
    </>
  );
};

// 親（Board）はドラッグ中の再描画で毎回新しい cover オブジェクトと
// コールバックを渡してくる。コールバックはセルごとに挙動が固定なので
// 比較から除外し、cover の内容と disabled だけで同一判定する。
// これにより45セルの不要な再レンダー（createTheme を含む）を防ぐ。
export default memo(
  CoverButton,
  (prev, next) =>
    prev.disabled === next.disabled &&
    prev.cover.row === next.cover.row &&
    prev.cover.col === next.cover.col &&
    prev.cover.open === next.cover.open &&
    prev.cover.prob === next.cover.prob &&
    prev.cover.probFlag === next.cover.probFlag &&
    prev.cover.isBest === next.cover.isBest &&
    prev.cover.colorValue === next.cover.colorValue,
);

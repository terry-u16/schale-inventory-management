import { type FC } from 'react';
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
import Button from '@mui/material/Button';

export interface Cover {
  row: number;
  col: number;
  open: boolean;
  prob: number;
  probFlag: number;
  isBest: boolean;
}

type Props = {
  cover: Cover;
  onClick: () => void;
};

const boxStyleGenerator = (row: number, col: number) => ({
  gridRow: row,
  gridColumn: col,
});

const buttonStyleGenerator = (
  opacity: number,
  isBest: boolean,
  borderColor: string,
) => {
  const color = isBest ? borderColor : '#bdbdbd';
  const thickness = isBest ? 3 : 1;

  return {
    opacity,
    maxWidth: '65px',
    maxHeight: '65px',
    minWidth: '65px',
    minHeight: '65px',
    border: `${thickness}px solid ${color}`,
  };
};

const CoverButton: FC<Props> = (props) => {
  const { row, col, open, prob, probFlag, isBest } = props.cover;
  const opacity = open ? 0.1 : 1;

  const probText =
    probFlag > 0 ? `${(Math.round(prob * 1000) / 10).toFixed(1)}%` : '';
  const colorPalette = [
    blueGrey[400],
    red[400],
    yellow[400],
    orange[400],
    lightBlue[400],
    purple[400],
    lightGreen[400],
    '#f889da',
  ];

  const darkColorPalette = [
    blueGrey[700],
    red[700],
    yellow[700],
    orange[700],
    lightBlue[700],
    purple[700],
    lightGreen[700],
    '#d1029a',
  ];

  const generateColor = (probFlag: number, prob: number) => {
    if (probFlag === 0) {
      return blueGrey[100];
    }

    let s = '#';
    const baseColor = colorPalette[probFlag];

    for (let i = 0; i < 3; i++) {
      const v = parseInt(baseColor.substring(1 + i * 2, 3 + i * 2), 16);
      const c = Math.floor(v * Math.sqrt(prob) + 255 * (1 - Math.sqrt(prob)));
      s += c.toString(16).padStart(2, '0');
    }

    return s;
  };

  const color = generateColor(probFlag, prob);
  const darkColor = darkColorPalette[probFlag];

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
          }}
          style={boxStyleGenerator(row, col)}
        >
          <Button
            variant="contained"
            key={`cover${row}-${col}`}
            onClick={props.onClick}
            style={buttonStyleGenerator(opacity, isBest, darkColor)}
            disableElevation
          >
            {probText}
          </Button>
        </Box>
      </ThemeProvider>
    </>
  );
};

export default CoverButton;

import { type FC } from 'react';
import { Box } from '@mui/material';
import {
  blueGrey,
  lightBlue,
  lightGreen,
  orange,
  pink,
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
}

type Props = {
  cover: Cover;
  onClick: () => void;
};

const boxStyleGenerator = (row: number, col: number) => ({
  gridRow: row,
  gridColumn: col,
});

const buttonStyleGenerator = (opacity: number) => ({
  opacity,
  maxWidth: '65px',
  maxHeight: '65px',
  minWidth: '65px',
  minHeight: '65px',
});

const CoverButton: FC<Props> = (props) => {
  const { row, col, open, prob, probFlag } = props.cover;
  const opacity = open ? 0.1 : 1;

  const probText = probFlag > 0 ? `${(prob * 100).toFixed(1)}%` : '';
  const colorPalette = [
    blueGrey,
    red,
    yellow,
    orange,
    lightBlue,
    purple,
    lightGreen,
    pink,
  ];

  const generateColor = (probFlag: number, prob: number) => {
    if (probFlag === 0) {
      return blueGrey[100];
    }

    let s = '#';
    const baseColor = colorPalette[probFlag][500];

    for (let i = 0; i < 3; i++) {
      const v = parseInt(baseColor.substring(1 + i * 2, 3 + i * 2), 16);
      const c = Math.floor(v * Math.sqrt(prob) + 255 * (1 - Math.sqrt(prob)));
      s += c.toString(16).padStart(2, '0');
    }

    return s;
  };

  const color = generateColor(probFlag, prob);

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
            style={buttonStyleGenerator(opacity)}
            sx={{ border: 1, borderColor: '#bdbdbd' }}
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

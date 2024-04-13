import { type FC } from 'react';
import { pink, indigo, cyan, yellow } from '@mui/material/colors';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';

export interface Cover {
  row: number;
  col: number;
  open: boolean;
  colorMod: number;
}

type Props = {
  cover: Cover;
  onClick: () => void;
};

const styleGenerator = (opacity: number, row: number, col: number) => ({
  opacity,
  gridRow: row,
  gridColumn: col,
  maxWidth: '50px',
  maxHeight: '50px',
  minWidth: '50px',
  minHeight: '50px',
});

const CoverButton: FC<Props> = (props) => {
  const { row, col, open, colorMod } = props.cover;
  const opacity = open ? 0.2 : 1;

  const color = [yellow, indigo, cyan, pink][colorMod];

  const theme = createTheme({
    palette: {
      primary: {
        main: color[100],
      },
    },
  });

  return (
    <>
      <ThemeProvider theme={theme}>
        <Button
          variant="contained"
          key={`cover${row}-${col}`}
          onClick={props.onClick}
          style={styleGenerator(opacity, row, col)}
        ></Button>
      </ThemeProvider>
    </>
  );
};

export default CoverButton;

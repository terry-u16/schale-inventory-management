import { type FC } from 'react';
import { Box } from '@mui/material';
import { blueGrey } from '@mui/material/colors';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';

export interface Cover {
  row: number;
  col: number;
  open: boolean;
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
  const { row, col, open } = props.cover;
  const opacity = open ? 0.15 : 1;

  const theme = createTheme({
    palette: {
      primary: {
        main: blueGrey[100],
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
          ></Button>
        </Box>
      </ThemeProvider>
    </>
  );
};

export default CoverButton;

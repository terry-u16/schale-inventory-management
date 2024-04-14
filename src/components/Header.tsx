import { type FC } from 'react';
import { AppBar, Stack, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CalculateIcon from '@mui/icons-material/Calculate';

const Header: FC = () => {
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: grey[700],
      },
    },
  });

  return (
    <>
      <ThemeProvider theme={theme}>
        <AppBar position="fixed" sx={{ textAlign: 'start' }}>
          <Stack
            direction="row"
            spacing={2}
            p={1.5}
            sx={{ alignItems: 'center' }}
          >
            <CalculateIcon sx={{ fontSize: 40 }} />
            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
              シャーレの総決算with連邦生徒会 在庫管理計算機
            </Typography>
          </Stack>
        </AppBar>
      </ThemeProvider>
    </>
  );
};

export default Header;

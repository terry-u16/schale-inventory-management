import { type FC } from 'react';
import {
  AppBar,
  Container,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CalculateIcon from '@mui/icons-material/Calculate';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';

const Header: FC = () => {
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: grey[700],
      },
    },
  });

  const { i18n, t } = useTranslation('Header');

  const handleLanguageChange = (event: SelectChangeEvent) => {
    i18n.changeLanguage(event.target.value);
  };

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
            <CalculateIcon sx={{ fontSize: 32 }} />
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
              {t('typography')}
            </Typography>
            <Container
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 1,
                width: 'auto',
              }}
            >
              <LanguageIcon sx={{ fontSize: 24 }} />
              <FormControl size="small">
                <Select
                  value={i18n.language}
                  onChange={handleLanguageChange}
                  sx={{ backgroundColor: '#ffffff' }}
                >
                  <MenuItem value="jp">日本語</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>
            </Container>
          </Stack>
        </AppBar>
      </ThemeProvider>
    </>
  );
};

export default Header;

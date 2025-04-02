import { type FC, useEffect, useState } from 'react';
import { Check } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  AppBar,
  CircularProgress,
  Container,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import CalculateIcon from '@mui/icons-material/Calculate';
import TranslateIcon from '@mui/icons-material/Translate';

async function sleep(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const open = Boolean(anchorEl);

  const handleClickListItem = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = async (
    _event: React.MouseEvent<HTMLElement>,
    lang: string,
  ) => {
    setIsLoading(true);
    setAnchorEl(null);
    await sleep(500); //
    await i18n.changeLanguage(lang);
    setIsLoading(false);
  };

  useEffect(() => {
    document.title = t('typography');
  }, [i18n.language]);

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
              <LoadingButton
                loading={isLoading}
                sx={{ color: 'white' }}
                onClick={handleClickListItem}
                loadingIndicator={
                  <CircularProgress sx={{ color: 'white' }} size={24} />
                }
                startIcon={<TranslateIcon />}
              >
                {t(`lang.${i18n.language}`)}
              </LoadingButton>
            </Container>

            {Array.isArray(i18n.options.supportedLngs) && (
              <>
                <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                  {i18n.options.supportedLngs.map((lang: string, idx) => (
                    <MenuItem
                      key={idx}
                      onClick={async (ev) => {
                        await handleMenuItemClick(ev, lang);
                      }}
                    >
                      {lang === i18n.language ? (
                        <>
                          <ListItemIcon>
                            <Check />
                          </ListItemIcon>
                          {t(`lang.${lang}`)}
                        </>
                      ) : (
                        <ListItemText inset>{t(`lang.${lang}`)}</ListItemText>
                      )}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
          </Stack>
        </AppBar>
      </ThemeProvider>
    </>
  );
};

export default Header;

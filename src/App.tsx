import './App.css';
import { type FC, useEffect, useState } from 'react';
import { Box, ThemeProvider, createTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import MainArea from './components/MainArea';
import Note from './components/Note';
import NotificationPanel from './components/NotificationPanel';
import Overlay from './components/Overlay';
import OverlayProvider from './components/OverlayProvider';
import PlaceSelectHelper from './components/PlaceSelectHelper';

const App: FC = () => {
  const [fontFamily, setFontFamily] = useState<string[]>([]);
  const { i18n } = useTranslation();

  const theme = createTheme({
    typography: {
      fontFamily: fontFamily.join(','),
    },
  });

  useEffect(() => {
    switch (i18n.language) {
      case 'ja': {
        setFontFamily([
          'Roboto',
          '"Noto Sans JP"',
          '"Helvetica"',
          'Arial',
          'sans-serif',
        ]);
        break;
      }
      case 'en': {
        setFontFamily([
          'Roboto',
          '"Noto Sans JP"',
          '"Helvetica"',
          'Arial',
          'sans-serif',
        ]);
        break;
      }
      case 'zh-CN': {
        setFontFamily(['Arial', 'Helvetica', 'sans-serif', '宋体']);
        break;
      }
    }
  }, [i18n.language]);

  return (
    <>
      <ThemeProvider theme={theme}>
        <OverlayProvider>
          <PlaceSelectHelper>
            <Header />
            <Box width={1200} mt={5} position="relative">
              <Overlay />
              <NotificationPanel />
              <MainArea />
              <Note />
            </Box>
          </PlaceSelectHelper>
        </OverlayProvider>
      </ThemeProvider>
    </>
  );
};

export default App;

import './App.css';
import { type FC } from 'react';
import { Box, ThemeProvider, createTheme } from '@mui/material';
import Header from './components/Header';
import MainArea from './components/MainArea';
import Note from './components/Note';
// import NotificationPanel from './components/NotificationPanel';
import Overlay from './components/Overlay';
import OverlayProvider from './components/OverlayProvider';
import PlaceSelectHelper from './components/PlaceSelectHelper';

const App: FC = () => {
  const theme = createTheme({
    typography: {
      fontFamily: [
        'Roboto',
        '"Noto Sans JP"',
        '"Helvetica"',
        'Arial',
        'sans-serif',
      ].join(','),
    },
  });

  return (
    <>
      <ThemeProvider theme={theme}>
        <OverlayProvider>
          <PlaceSelectHelper>
            <Header />
            <Box width={1200} mt={5} position="relative">
              <Overlay />
              {/* <NotificationPanel /> */}
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

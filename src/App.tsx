import './App.css';
import { type FC } from 'react';
import { Box, ThemeProvider, createTheme } from '@mui/material';
import Header from './components/Header';
import MainArea from './components/MainArea';
import Note from './components/Note';
import NotificationPanel from './components/NotificationPanel';

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
        <Header />
        <Box width={1200} mt={5}>
          <NotificationPanel />
          <MainArea />
          <Note />
        </Box>
      </ThemeProvider>
    </>
  );
};

export default App;

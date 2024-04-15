import './App.css';
import { type FC } from 'react';
import { Box } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header';
import InitWasm from './components/InitWasm';
import Note from './components/Note';

const App: FC = () => {
  const theme = createTheme({
    palette: {
      mode: 'light',
    },
  });

  return (
    <>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <Header />
        <Box width={1200}>
          <InitWasm />
          <Note />
        </Box>
      </ThemeProvider>
    </>
  );
};

export default App;

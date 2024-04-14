import './App.css';
import { type FC } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header';
import InitWasm from './components/InitWasm';

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
        <InitWasm />
      </ThemeProvider>
    </>
  );
};

export default App;

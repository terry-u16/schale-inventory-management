import './App.css';
import { type FC } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import InitWasm from './components/InitWasm';

const App: FC = () => {
  const theme = createTheme({
    palette: {
      mode: 'light',
    },
  });

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <InitWasm />
      </ThemeProvider>
    </>
  );
};

export default App;

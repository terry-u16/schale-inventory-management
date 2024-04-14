import './App.css';
import { type FC } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MainArea from './components/MainArea';

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
        <MainArea />
      </ThemeProvider>
    </>
  );
};

export default App;

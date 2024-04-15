import './App.css';
import { type FC } from 'react';
import { Box } from '@mui/material';
import Header from './components/Header';
import InitWasm from './components/InitWasm';
import Note from './components/Note';

const App: FC = () => {
  return (
    <>
      <Header />
      <Box width={1200}>
        <InitWasm />
        <Note />
      </Box>
    </>
  );
};

export default App;

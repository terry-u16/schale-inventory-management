import './App.css';
import { type FC } from 'react';
import { Box } from '@mui/material';
import Header from './components/Header';
import MainArea from './components/MainArea';
import Note from './components/Note';

const App: FC = () => {
  return (
    <>
      <Header />
      <Box width={1200}>
        <MainArea />
        <Note />
      </Box>
    </>
  );
};

export default App;

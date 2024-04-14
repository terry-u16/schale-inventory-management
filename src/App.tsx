import './App.css';
import { type FC, useState } from 'react';
import { Box } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import viteLogo from '../public/vite.svg';
import reactLogo from './assets/react.svg';
import Board from './components/Board';
import ItemPane, { type ItemSet } from './components/ItemPane';

const App: FC = () => {
  const theme = createTheme({
    palette: {
      mode: 'light',
    },
  });

  const [count, setCount] = useState(0);
  const itemSets: ItemSet[] = [
    {
      item: {
        width: 3,
        height: 2,
        id: '1',
      },
      count: 1,
    },
    {
      item: {
        width: 1,
        height: 3,
        id: '2',
      },
      count: 3,
    },
    {
      item: {
        width: 2,
        height: 1,
        id: '3',
      },
      count: 5,
    },
  ];

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div>
          <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" rel="noreferrer">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Vite + React</h1>
        <div className="card">
          <button
            onClick={() => {
              setCount((count) => count + 1);
            }}
          >
            count is {count}
          </button>
          <p>
            Edit <code>src/App.tsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
        <Box margin={5}>
          <Board></Board>
        </Box>
        <Grid container spacing={2}>
          {itemSets.map((itemSet, index) => (
            <Grid item xs={4} key={`item-pane-grid-${index}`}>
              <ItemPane
                key={`item-pane-${index}`}
                itemSet={itemSet}
                placedItems={[
                  {
                    item: itemSet.item,
                    row: 1,
                    col: 1,
                    rotated: false,
                    id: '1',
                  },
                  {
                    item: itemSet.item,
                    row: 3,
                    col: 2,
                    rotated: true,
                    id: '1',
                  },
                ]}
                index={index + 1}
              ></ItemPane>
            </Grid>
          ))}
        </Grid>
      </ThemeProvider>
    </>
  );
};

export default App;

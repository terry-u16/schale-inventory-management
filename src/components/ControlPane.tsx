import { type FC } from 'react';
import { LoadingButton } from '@mui/lab';
import { Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Looks3Icon from '@mui/icons-material/Looks3';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Box from '@mui/material/Box';

type Props = {
  isRunning: boolean;
  showProb: boolean[];
  probsAvailable: boolean;
  onExecute: () => void;
  onToggleShowProb: (index: number) => void;
};

const ControlPane: FC<Props> = (props) => {
  const { isRunning, showProb, probsAvailable, onExecute, onToggleShowProb } =
    props;

  return (
    <>
      <Paper>
        <Box p={3} display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
          <LoadingButton
            onClick={onExecute}
            loading={isRunning}
            startIcon={<PlayArrowIcon />}
            variant="contained"
            sx={{ gridColumn: '1' }}
          >
            <span>実行</span>
          </LoadingButton>
          <ToggleButtonGroup sx={{ gridColumn: '2' }} color="primary">
            <ToggleButton
              value="one"
              selected={showProb[0] && probsAvailable}
              onClick={() => {
                onToggleShowProb(0);
              }}
              disabled={!probsAvailable}
            >
              <LooksOneIcon />
            </ToggleButton>
            <ToggleButton
              value="two"
              selected={showProb[1] && probsAvailable}
              onClick={() => {
                onToggleShowProb(1);
              }}
              disabled={!probsAvailable}
            >
              <LooksTwoIcon />
            </ToggleButton>
            <ToggleButton
              value="three"
              selected={showProb[2] && probsAvailable}
              onClick={() => {
                onToggleShowProb(2);
              }}
              disabled={!probsAvailable}
            >
              <Looks3Icon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>
    </>
  );
};

export default ControlPane;

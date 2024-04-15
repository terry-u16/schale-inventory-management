import { useState, type FC } from 'react';
import { LoadingButton } from '@mui/lab';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Button,
} from '@mui/material';
import GradingIcon from '@mui/icons-material/Grading';
import Looks3Icon from '@mui/icons-material/Looks3';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Box from '@mui/material/Box';
import { type ItemAndPlacement } from './MainArea';
import ShareButton from './ShareButton';

type Props = {
  itemAndPlacements: ItemAndPlacement[];
  openPanels: boolean[];
  isRunning: boolean;
  showProb: boolean[];
  onExecute: () => void;
  onToggleShowProb: (index: number) => void;
  onItemPresetApply: (preset: number) => void;
};

const ControlPane: FC<Props> = (props) => {
  const {
    itemAndPlacements,
    openPanels,
    isRunning,
    showProb,
    onExecute,
    onToggleShowProb,
    onItemPresetApply,
  } = props;
  const [predefinedChoice, setPredefinedChoice] = useState('0');

  const handlepredefinedChoiceChange = (event: SelectChangeEvent) => {
    setPredefinedChoice(event.target.value);
  };

  return (
    <>
      <Paper>
        <Box
          p={2}
          display="grid"
          gridTemplateColumns="1fr 1fr 2.5fr 0.5fr 56px"
          gap={2}
        >
          <FormControl>
            <InputLabel id="predefined-choice-label">備品プリセット</InputLabel>
            <Select
              labelId="predefined-choice-select"
              id="predefined-choice-select"
              value={predefinedChoice}
              label="備品プリセット"
              onChange={handlepredefinedChoiceChange}
            >
              <MenuItem value={0}>1周目</MenuItem>
              <MenuItem value={1}>2周目</MenuItem>
              <MenuItem value={2}>3周目</MenuItem>
              <MenuItem value={3}>4周目</MenuItem>
              <MenuItem value={4}>5周目</MenuItem>
              <MenuItem value={5}>6周目</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="備品プリセットを適用する">
            <Button
              variant="outlined"
              startIcon={<GradingIcon />}
              onClick={() => {
                onItemPresetApply(parseInt(predefinedChoice));
              }}
            >
              適用
            </Button>
          </Tooltip>
          <Tooltip title="各マスにおける備品の存在確率を計算する">
            <LoadingButton
              onClick={onExecute}
              loading={isRunning}
              startIcon={<PlayArrowIcon />}
              variant="contained"
              size="large"
            >
              <span>実行</span>
            </LoadingButton>
          </Tooltip>
          <ToggleButtonGroup color="primary">
            <Tooltip title="備品1の確率表示ON/OFFを切り替え">
              <span>
                <ToggleButton
                  value="one"
                  selected={showProb[0]}
                  onClick={() => {
                    onToggleShowProb(0);
                  }}
                  sx={{ height: '56px' }}
                >
                  <LooksOneIcon />
                </ToggleButton>
              </span>
            </Tooltip>
            <Tooltip title="備品2の確率表示ON/OFFを切り替え">
              <span>
                <ToggleButton
                  value="two"
                  selected={showProb[1]}
                  onClick={() => {
                    onToggleShowProb(1);
                  }}
                  sx={{ height: '56px' }}
                >
                  <LooksTwoIcon />
                </ToggleButton>
              </span>
            </Tooltip>
            <Tooltip title="備品3の確率表示ON/OFFを切り替え">
              <span>
                <ToggleButton
                  value="three"
                  selected={showProb[2]}
                  onClick={() => {
                    onToggleShowProb(2);
                  }}
                  sx={{ height: '56px' }}
                >
                  <Looks3Icon />
                </ToggleButton>
              </span>
            </Tooltip>
          </ToggleButtonGroup>
          <ShareButton
            itemAndPlacements={itemAndPlacements}
            openPanels={openPanels}
          />
        </Box>
      </Paper>
    </>
  );
};

export default ControlPane;

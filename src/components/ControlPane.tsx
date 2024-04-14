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

type Props = {
  isRunning: boolean;
  showProb: boolean[];
  probsAvailable: boolean;
  onExecute: () => void;
  onToggleShowProb: (index: number) => void;
  onItemPresetApply: (preset: number) => void;
};

const ControlPane: FC<Props> = (props) => {
  const {
    isRunning,
    showProb,
    probsAvailable,
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
        <Box p={3} display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
          <FormControl>
            <InputLabel id="predefined-choice-label">
              アイテムプリセット
            </InputLabel>
            <Select
              labelId="predefined-choice-select"
              id="predefined-choice-select"
              value={predefinedChoice}
              label="アイテムプリセット"
              onChange={handlepredefinedChoiceChange}
            >
              <MenuItem value={0}>1周目</MenuItem>
              <MenuItem value={1}>2周目</MenuItem>
              <MenuItem value={2}>3周目</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="アイテムプリセットを適用する">
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
          <Tooltip title="各マスにおけるアイテムの存在確率を計算する">
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
            <Tooltip title="アイテム1の確率表示ON/OFFを切り替え">
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
            </Tooltip>
            <Tooltip title="アイテム2の確率表示ON/OFFを切り替え">
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
            </Tooltip>
            <Tooltip title="アイテム3の確率表示ON/OFFを切り替え">
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
            </Tooltip>
          </ToggleButtonGroup>
        </Box>
      </Paper>
    </>
  );
};

export default ControlPane;

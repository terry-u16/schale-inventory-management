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
import { useTranslation } from 'react-i18next';
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
  recommendToRun: boolean;
  onExecute: () => void;
  onToggleShowProb: (index: number) => void;
  onItemPresetApply: (preset: number) => void;
  onResetMap: () => void;
};

const ControlPane: FC<Props> = (props) => {
  const {
    itemAndPlacements,
    openPanels,
    isRunning,
    showProb,
    recommendToRun,
    onExecute,
    onToggleShowProb,
    onItemPresetApply,
    onResetMap,
  } = props;
  const { t } = useTranslation('ControlPane');

  const [predefinedChoice, setPredefinedChoice] = useState('0');

  const handlepredefinedChoiceChange = (event: SelectChangeEvent) => {
    setPredefinedChoice(event.target.value);
  };

  const runButtonStyle = recommendToRun ? 'contained' : 'outlined';

  return (
    <>
      <Paper>
        <Box
          p={2}
          display="grid"
          gridTemplateColumns="1fr 1fr 0.5fr 2.5fr 0.5fr 56px"
          gap={2}
        >
          <FormControl>
            <InputLabel id="predefined-choice-label">
              {t('predefined_choice_label')}
            </InputLabel>
            <Select
              labelId="predefined-choice-select"
              id="predefined-choice-select"
              value={predefinedChoice}
              label={t('predefined_choice_label')}
              onChange={handlepredefinedChoiceChange}
            >
              <MenuItem value={0}>{t('predefined_choice_select.0')}</MenuItem>
              <MenuItem value={1}>{t('predefined_choice_select.1')}</MenuItem>
              <MenuItem value={2}>{t('predefined_choice_select.2')}</MenuItem>
              <MenuItem value={3}>{t('predefined_choice_select.3')}</MenuItem>
              <MenuItem value={4}>{t('predefined_choice_select.4')}</MenuItem>
              {/*
              <MenuItem value={5}>{t('predefined_choice_select.5')}</MenuItem>
              <MenuItem value={6}>{t('predefined_choice_select.6')}</MenuItem>
              */}
            </Select>
          </FormControl>
          <Tooltip title={t('item_preset_apply_button_tooltip')}>
            <Button
              variant="outlined"
              startIcon={<GradingIcon />}
              onClick={() => {
                onItemPresetApply(parseInt(predefinedChoice));
              }}
            >
              {t('item_preset_apply_button')}
            </Button>
          </Tooltip>
          <Button variant="outlined" onClick={onResetMap}>
            RESET
          </Button>
          <Tooltip title={t('execute_button_tooltip')}>
            <LoadingButton
              onClick={onExecute}
              loading={isRunning}
              startIcon={<PlayArrowIcon />}
              variant={runButtonStyle}
              size="large"
            >
              <span>{t('execute_button')}</span>
            </LoadingButton>
          </Tooltip>
          <ToggleButtonGroup color="primary">
            <Tooltip title={t('look_one_button_tooltip')}>
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
            <Tooltip title={t('look_two_button_tooltip')}>
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
            <Tooltip title={t('look_three_button_tooltip')}>
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

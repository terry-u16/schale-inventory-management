import { useState, type FC } from 'react';
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
import ExposureIcon from '@mui/icons-material/Exposure';
import GradingIcon from '@mui/icons-material/Grading';
import Box from '@mui/material/Box';
import { type ItemAndPlacement } from './MainArea';
import ShareButton from './ShareButton';

type Props = {
  itemAndPlacements: ItemAndPlacement[];
  openPanels: boolean[];
  probScale: 'max' | 'minmax';
  onToggleProbScale: () => void;
  onItemPresetApply: (preset: number) => void;
  onResetMap: () => void;
};

const ControlPane: FC<Props> = (props) => {
  const {
    itemAndPlacements,
    openPanels,
    probScale,
    onToggleProbScale,
    onItemPresetApply,
    onResetMap,
  } = props;
  const { t } = useTranslation('ControlPane');

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
          gridTemplateColumns="1.5fr 1fr 0.7fr 56px 56px"
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
              MenuProps={{ disableScrollLock: true }}
            >
              <MenuItem value={0}>{t('predefined_choice_select.0')}</MenuItem>
              <MenuItem value={1}>{t('predefined_choice_select.1')}</MenuItem>
              <MenuItem value={2}>{t('predefined_choice_select.2')}</MenuItem>
              <MenuItem value={3}>{t('predefined_choice_select.3')}</MenuItem>
              <MenuItem value={4}>{t('predefined_choice_select.4')}</MenuItem>
              <MenuItem value={5}>{t('predefined_choice_select.5')}</MenuItem>
              <MenuItem value={6}>{t('predefined_choice_select.6')}</MenuItem>
              <MenuItem value={7}>{t('predefined_choice_select.7')}</MenuItem>
              <MenuItem value={8}>{t('predefined_choice_select.8')}</MenuItem>
              <MenuItem value={9}>{t('predefined_choice_select.9')}</MenuItem>
              <MenuItem value={10}>{t('predefined_choice_select.10')}</MenuItem>
              <MenuItem value={11}>{t('predefined_choice_select.11')}</MenuItem>
              <MenuItem value={12}>{t('predefined_choice_select.12')}</MenuItem>
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
          <ToggleButtonGroup color="primary">
            <Tooltip title={t('normalize_button_tooltip')}>
              <span>
                <ToggleButton
                  value="normalize"
                  selected={probScale === 'minmax'}
                  onClick={onToggleProbScale}
                  sx={{ height: '56px' }}
                  aria-label={t('normalize_button')}
                >
                  <ExposureIcon />
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

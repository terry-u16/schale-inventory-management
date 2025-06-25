import { type FC } from 'react';
import { Alert, Box, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

const NotificationPanel: FC = () => {
  const { t } = useTranslation('NotificationPanel');

  return (
    <>
      <Paper>
        <Box p={2} textAlign="start">
          <Alert severity="warning">
            {t('alert.0')}
            <a
              href="https://github.com/terry-u16/schale-inventory-management/issues"
              target="_blank"
              rel="noreferrer"
            >
              {t('alert.1')}
            </a>
            {t('alert.2')}
          </Alert>
        </Box>
      </Paper>
    </>
  );
};

export default NotificationPanel;

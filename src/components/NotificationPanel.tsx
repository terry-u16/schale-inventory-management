import { type FC } from 'react';
import { Alert, Box, Paper } from '@mui/material';

const NotificationPanel: FC = () => {
  return (
    <>
      <Paper>
        <Box p={2} textAlign="start">
          <Alert severity="warning">
            こちらのツールは2024/4/11開始の総決算イベントのデータに基づいています。
            2024/6/5開始の総決算イベントには未対応ですので、恐れ入りますがデータが出揃うまでお待ちください。
          </Alert>
        </Box>
      </Paper>
    </>
  );
};

export default NotificationPanel;

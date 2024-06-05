import { type FC } from 'react';
import { Alert, Box, Paper } from '@mui/material';

const NotificationPanel: FC = () => {
  return (
    <>
      <Paper>
        <Box p={2} textAlign="start">
          <Alert severity="warning">
            現在、2024/6/5開始の総決算イベントへの対応を進めています。
            備品の種類については最新版への更新が完了していますが、2周目以降の備品数量が不明なため仮の値を設定しています。
            ご不便をおかけしますが、ご使用の際には数量を手動で設定するようよろしくお願いいたします。
          </Alert>
        </Box>
      </Paper>
    </>
  );
};

export default NotificationPanel;

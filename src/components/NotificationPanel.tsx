import { type FC } from 'react';
import { Alert, Box, Paper } from '@mui/material';

const NotificationPanel: FC = () => {
  return (
    <>
      <Paper>
        <Box p={2} textAlign="start">
          <Alert severity="success">
            2024/9/25開始の山海経イベントへの対応を完了しました。
            お気付きの点がございましたら
            <a
              href="https://github.com/terry-u16/schale-inventory-management/issues"
              target="_blank"
              rel="noreferrer"
            >
              githubのissue
            </a>
            にてご報告頂けますと幸いです。
          </Alert>
        </Box>
      </Paper>
    </>
  );
};

export default NotificationPanel;

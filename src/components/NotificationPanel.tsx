import { type FC } from 'react';
import { Alert, Box, Paper } from '@mui/material';

const NotificationPanel: FC = () => {
  return (
    <>
      <Paper>
        <Box p={2} textAlign="start">
          <Alert severity="warning">
            現在、2024/12/24開始のミレニアムイベントの対応を進めています。
            1周目の備品の種類・数量については最新版への更新が完了しておりますが、2周目以降の備品の数量については不明なため仮の値を設定しています。
            2周目以降の備品数量をご存じの方は
            <a
              href="https://github.com/terry-u16/schale-inventory-management/issues"
              target="_blank"
              rel="noreferrer"
            >
              githubのissue
            </a>
            にてご報告頂けますと幸いです。
            ご不便をおかけしますが、どうぞよろしくお願いいたします。
          </Alert>
        </Box>
      </Paper>
    </>
  );
};

export default NotificationPanel;

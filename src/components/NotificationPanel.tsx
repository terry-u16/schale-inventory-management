import { type FC } from 'react';
import { Alert, Box, Paper } from '@mui/material';

const NotificationPanel: FC = () => {
  return (
    <>
      <Paper>
        <Box p={2} textAlign="start">
          <Alert severity="warning">
            現在、2025/3/12開始の総決算イベントの対応を進めています。
            1～6周目の備品の種類・数量については最新版への更新が完了しておりますが、7周目以降の備品の数量については不明なため仮の値を設定しています。
            また、4～6周目の備品の数量については1～3周目の数量と同じであると仮定しているため、念のため使用前に実際の数量と異なっていないかご確認ください。
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

import { type FC } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ShareIcon from '@mui/icons-material/Share';
import { type ItemAndPlacement } from './MainArea';

type Props = {
  itemAndPlacements: ItemAndPlacement[];
  openPanels: boolean[];
};

const ShareButton: FC<Props> = (props) => {
  const { itemAndPlacements, openPanels } = props;
  const { t } = useTranslation('Share');

  const allItemCount = itemAndPlacements
    .map((ip) => ip.item.count)
    .reduce((a, b) => a + b, 0);
  const foundItemCount = itemAndPlacements
    .map((ip) => ip.placements.length)
    .reduce((a, b) => a + b, 0);
  const openPanelCount = openPanels.filter((panel) => panel).length;

  const shareMessage =
    (allItemCount === foundItemCount
      ? t('find_all', { openPanelCount, allItemCount })
      : t('find_some', { openPanelCount, allItemCount, foundItemCount })) +
    ' https://schale-inventory-management.terry-u16.net/';
  const tag = 'シャーレ在庫管理計算機';
  const link = `https://x.com/compose/post?hashtags=${tag}&text=${encodeURIComponent(shareMessage)}`;

  const onClickShare = () => {
    window.open(link, '_blank', 'noreferrer');
  };

  return (
    <>
      <Tooltip title={t('share_button')}>
        <IconButton aria-label="share-x" onClick={onClickShare}>
          <ShareIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default ShareButton;

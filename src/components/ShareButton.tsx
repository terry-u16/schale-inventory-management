import { type FC } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import { type ItemAndPlacement } from './MainArea';

type Props = {
  itemAndPlacements: ItemAndPlacement[];
  openPanels: boolean[];
};

const ShareButton: FC<Props> = (props) => {
  const { itemAndPlacements, openPanels } = props;

  const allItemCount = itemAndPlacements
    .map((ip) => ip.item.count)
    .reduce((a, b) => a + b, 0);
  const foundItemCount = itemAndPlacements
    .map((ip) => ip.placements.length)
    .reduce((a, b) => a + b, 0);
  const openPanelCount = openPanels.filter((panel) => panel).length;

  const shareMessage =
    (allItemCount === foundItemCount
      ? `「シャーレの総決算with連邦生徒会 在庫管理計算機」を使って、${openPanelCount}個のパネルを開いて${allItemCount}個全ての在庫を発見しました！`
      : `「シャーレの総決算with連邦生徒会 在庫管理計算機」を使って、${openPanelCount}個のパネルを開いて${allItemCount}個中${foundItemCount}個の在庫を発見しました！`) +
    ' https://test.com/';
  const tag = 'シャーレ在庫管理計算機';
  const link = `https://x.com/compose/post?hashtags=${tag}&text=${encodeURIComponent(shareMessage)}`;

  const onClickShare = () => {
    window.open(link, '_blank', 'noreferrer');
  };

  return (
    <>
      <Tooltip title="Xで共有">
        <IconButton aria-label="share-x" onClick={onClickShare}>
          <ShareIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default ShareButton;

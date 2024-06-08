import { type FC } from 'react';
import './Overlay.css';
import { useOverlayContext } from './OverlayProvider';

export type OverlayMask = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const Overlay: FC = () => {
  const { visible, maskList } = useOverlayContext();

  return (
    <div id="overlay" style={{ visibility: visible ? 'visible' : 'hidden' }}>
      <svg width="100%" height="100%">
        <defs>
          <mask id="mask">
            <rect width="100%" height="100%" fill="#fff" />
            {maskList.map((mask, index) => (
              <rect key={index} {...mask} />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" mask="url(#mask)" fillOpacity="0.75" />
      </svg>
    </div>
  );
};

export default Overlay;

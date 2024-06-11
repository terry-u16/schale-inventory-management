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
          <filter id="invert">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      1 0 0 0 0"
            />
          </filter>
        </defs>
        <g filter="url(#invert)">
          <rect width="100%" height="100%" fill="#ddd" />
          {maskList.map((mask, index) => (
            <rect key={index} {...mask} fill="#000" />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default Overlay;

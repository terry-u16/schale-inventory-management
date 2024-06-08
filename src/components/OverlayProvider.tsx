import {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
  type FC,
  useCallback,
} from 'react';
import './Overlay.css';
import { type OverlayMask } from './Overlay';

type Props = {
  children: ReactNode;
};

type OverlayContext = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  maskList: OverlayMask[];
  setMask: (key: string, mask: OverlayMask & { margin?: number }) => void;
  removeMask: (key: string) => void;
};
const overlayContext = createContext<OverlayContext>({
  visible: false,
  setVisible: () => {},
  maskList: [],
  setMask: () => {},
  removeMask: () => {},
});
export const useOverlayContext = (): OverlayContext =>
  useContext(overlayContext);

const OverlayProvider: FC<Props> = (props) => {
  const [visible, setVisible] = useState(false);
  const [mask, _setMask] = useState<Record<string, OverlayMask>>({});
  const setMask: OverlayContext['setMask'] = useCallback(
    (key, { margin = 0, ...mask }) => {
      mask.x -= margin;
      mask.y -= margin;
      mask.width += margin * 2;
      mask.height += margin * 2;
      _setMask((prev) => ({ ...prev, [key]: mask }));
    },
    [],
  );
  const removeMask: OverlayContext['removeMask'] = useCallback((key) => {
    _setMask((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)),
    );
  }, []);
  const value = useMemo(
    () => ({
      visible,
      setVisible,
      maskList: Object.values(mask),
      setMask,
      removeMask,
    }),
    [visible, mask, setMask, removeMask],
  );

  return (
    <overlayContext.Provider value={value}>
      {props.children}
    </overlayContext.Provider>
  );
};

export default OverlayProvider;

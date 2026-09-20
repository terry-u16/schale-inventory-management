import {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type FC,
  useCallback,
} from 'react';
import './Overlay.css';
import { type PlacedItem } from './ItemPane';
import { useOverlayContext } from './OverlayProvider';

type PlaceSelectHelperContext = {
  placeSelecting: boolean;
  selectingPlacedItem: PlacedItem | null;
  startPlaceSelect: (
    placedItem: PlacedItem,
    options?: {
      baseEvent?: Event;
      onSelect?: (validPlacedItem: PlacedItem) => void;
    },
  ) => void;
  setSelectingPlace: (row: number, col: number) => void;
};
const placeSelectHelperContext = createContext<PlaceSelectHelperContext>({
  placeSelecting: false,
  selectingPlacedItem: null,
  startPlaceSelect: () => {},
  setSelectingPlace: () => {},
});
export const usePlaceSelectHelper = (): PlaceSelectHelperContext =>
  useContext(placeSelectHelperContext);

let selecting = false;

const PlaceSelectHelper: FC<{ children: ReactNode }> = (props) => {
  const { setVisible: setOverlayVisible } = useOverlayContext();
  const [placedItem, setPlacedItem] = useState<PlacedItem | null>(null);
  const refPlacedItem = useRef<PlacedItem | null>(placedItem);
  const refOnSelect = useRef<((validPlacedItem: PlacedItem) => void) | null>(
    null,
  );
  const startPlaceSelect: PlaceSelectHelperContext['startPlaceSelect'] =
    useCallback(
      (placedItem, { baseEvent, onSelect } = {}) => {
        if (selecting) return;
        selecting = true;
        setOverlayVisible(true);
        refPlacedItem.current = { ...placedItem, row: -1, col: -1 };
        setPlacedItem(refPlacedItem.current);
        refOnSelect.current = onSelect ?? null;
        const endPlaceSelect = (e: Event) => {
          if (e === baseEvent) return;
          selecting = false;
          setOverlayVisible(false);
          // クリックが盤面上のセルなら、境界プレチェックを通さずに
          // 呼び出し元へ渡す（スマート配置のアンカー探索で判定する）。
          // 盤面外クリックはキャンセル扱い。
          if (
            refPlacedItem.current !== null &&
            refPlacedItem.current.row >= 1 &&
            refPlacedItem.current.col >= 1
          ) {
            const onSelect = refOnSelect.current;
            if (onSelect !== null) {
              setTimeout(onSelect, 0, refPlacedItem.current);
            }
          }
          refPlacedItem.current = null;
          setPlacedItem(null);
          window.removeEventListener('click', endPlaceSelect);
        };
        window.addEventListener('click', endPlaceSelect);
        const elBoardContainer = document.getElementById('board-container');
        if (elBoardContainer === null) return;
        document.documentElement.scrollTop = Math.min(
          document.documentElement.scrollTop,
          elBoardContainer.offsetTop,
        );
      },
      [setOverlayVisible],
    );
  const setSelectingPlace = useCallback((row: number, col: number) => {
    if (refPlacedItem.current === null) return;
    refPlacedItem.current = { ...refPlacedItem.current, row, col };
    setPlacedItem(refPlacedItem.current);
  }, []);
  const value = useMemo(
    () => ({
      placeSelecting: placedItem !== null,
      // ホバー先が盤面内なら常に渡す（境界チェックはしない）。
      // 落下地点の計算（スマート配置）は Board 側で行い、
      // 角・隅でも虚影が実際の配置先を示すようにする。
      selectingPlacedItem:
        placedItem !== null && placedItem.row >= 1 && placedItem.col >= 1
          ? placedItem
          : null,
      startPlaceSelect,
      setSelectingPlace,
    }),
    [placedItem, startPlaceSelect, setSelectingPlace],
  );

  return (
    <placeSelectHelperContext.Provider value={value}>
      {props.children}
    </placeSelectHelperContext.Provider>
  );
};

export default PlaceSelectHelper;

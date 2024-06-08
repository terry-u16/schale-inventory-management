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

const isValidPlaceItem = ({
  row,
  col,
  rotated,
  item: { width, height },
}: PlacedItem) => {
  const rowEnd = row + (rotated ? width : height);
  const colEnd = col + (rotated ? height : width);

  return row >= 1 && col >= 1 && rowEnd <= 5 + 1 && colEnd <= 9 + 1;
};

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
          if (
            refPlacedItem.current !== null &&
            isValidPlaceItem(refPlacedItem.current)
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
      selectingPlacedItem:
        placedItem !== null && isValidPlaceItem(placedItem) ? placedItem : null,
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

import { type FC, useState } from 'react';
import { Divider } from '@mui/material';
import { red, green, blue } from '@mui/material/colors';
import AddIcon from '@mui/icons-material/Add';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import PlacedItemPane from './PlacedItemPane';

export interface Item {
  width: number;
  height: number;
  index: number;
}

export interface PlacedItem {
  item: Item;
  rotated: boolean;
  row: number;
  col: number;
  id: string;
}

export function getRotatedHeight(item: PlacedItem): number {
  return item.rotated ? item.item.width : item.item.height;
}

export function getRotatedWidth(item: PlacedItem): number {
  return item.rotated ? item.item.height : item.item.width;
}

export function getItemColor(index: number): string {
  return [red, green, blue][(index - 1) % 3][400];
}

export interface ItemSet {
  item: Item;
  count: number;
}

type Props = {
  itemSet: ItemSet;
  placedItems: PlacedItem[];
  onModifyItem: (item: ItemSet) => void;
  onAddPlacedItem: (item: PlacedItem) => void;
  onModifyPlacedItem: (item: PlacedItem) => void;
  onRemovePlacedItem: (item: PlacedItem) => void;
};

const ItemPane: FC<Props> = (props) => {
  const {
    itemSet,
    placedItems,
    onModifyItem,
    onAddPlacedItem,
    onModifyPlacedItem,
    onRemovePlacedItem,
  } = props;
  const [widthStr, setWidthStr] = useState(itemSet.item.width.toString());
  const [heightStr, setHeightStr] = useState(itemSet.item.height.toString());
  const [countStr, setCountStr] = useState(itemSet.count.toString());

  const onWidthChange = (event: SelectChangeEvent) => {
    setWidthStr(event.target.value);
    onModifyItem({
      item: {
        width: Number(event.target.value),
        height: itemSet.item.height,
        index: itemSet.item.index,
      },
      count: itemSet.count,
    });
  };

  const onHeightChange = (event: SelectChangeEvent) => {
    setHeightStr(event.target.value);
    onModifyItem({
      item: {
        width: itemSet.item.width,
        height: Number(event.target.value),
        index: itemSet.item.index,
      },
      count: itemSet.count,
    });
  };

  const onCountChange = (event: SelectChangeEvent) => {
    setCountStr(event.target.value);
    onModifyItem({
      item: {
        width: itemSet.item.width,
        height: itemSet.item.height,
        index: itemSet.item.index,
      },
      count: Number(event.target.value),
    });
  };

  return (
    <>
      <Card>
        <CardHeader
          avatar={
            <Avatar
              sx={{ bgcolor: getItemColor(itemSet.item.index) }}
              aria-label="recipe"
            >
              {' '}
            </Avatar>
          }
          title={
            <Typography variant="h4">{`Item ${itemSet.item.index}`}</Typography>
          }
        />
        <CardContent>
          <Box display="grid" gridTemplateColumns="repeat(3, 100px)" gap={2}>
            <FormControl fullWidth>
              <InputLabel>高さ</InputLabel>
              <Select
                labelId="item-height"
                id="item-height"
                value={heightStr}
                label="高さ"
                onChange={onHeightChange}
              >
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>幅</InputLabel>
              <Select
                labelId="item-width"
                id="item-width"
                value={widthStr}
                label="幅"
                onChange={onWidthChange}
              >
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={4}>4</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>個数</InputLabel>
              <Select
                labelId="item-height"
                id="item-height"
                value={countStr}
                label="個数"
                onChange={onCountChange}
              >
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={4}>4</MenuItem>
                <MenuItem value={5}>5</MenuItem>
              </Select>
            </FormControl>

            <Box gridColumn="1 / 4" my={1}>
              <Divider />
            </Box>

            {placedItems.map((item: PlacedItem, index: number) => (
              <Box gridColumn="1 / 4" key={`box-${item.id}-${index}`}>
                <PlacedItemPane
                  key={item.id}
                  placedItem={item}
                  index={index}
                  onModifyPlacedItem={onModifyPlacedItem}
                  onRemovePlacedItem={onRemovePlacedItem}
                />
              </Box>
            ))}

            <Box gridColumn="1 / 4">
              <Button
                variant="contained"
                fullWidth
                startIcon={<AddIcon />}
                onClick={() => {
                  const newPlacedItem: PlacedItem = {
                    item: itemSet.item,
                    rotated: false,
                    row: 1,
                    col: 1,
                    id: crypto.randomUUID(),
                  };
                  onAddPlacedItem(newPlacedItem);
                }}
                disabled={placedItems.length >= itemSet.count}
              >
                追加
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

export default ItemPane;

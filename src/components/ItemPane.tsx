import { type FC } from 'react';
import { Divider, Tooltip } from '@mui/material';
import { red, lightBlue, yellow } from '@mui/material/colors';
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

export function getItemPalette(
  index: number,
): typeof red | typeof yellow | typeof lightBlue {
  return [red, yellow, lightBlue][(index - 1) % 3];
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
  const onWidthChange = (event: SelectChangeEvent) => {
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
              sx={{ bgcolor: getItemPalette(itemSet.item.index)[300] }}
              aria-label="recipe"
            >
              {' '}
            </Avatar>
          }
          title={
            <Typography variant="h5">{`備品 ${itemSet.item.index}`}</Typography>
          }
        />
        <CardContent>
          <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
            <FormControl fullWidth>
              <InputLabel>高さ</InputLabel>
              <Select
                labelId="item-height"
                id="item-height"
                value={itemSet.item.height.toString()}
                label="高さ"
                onChange={onHeightChange}
              >
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={4}>4</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>幅</InputLabel>
              <Select
                labelId="item-width"
                id="item-width"
                value={itemSet.item.width.toString()}
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
                value={itemSet.count.toString()}
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
              <Tooltip title="備品を配置する">
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
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

export default ItemPane;

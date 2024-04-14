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
  id: string;
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

export interface ItemSet {
  item: Item;
  count: number;
}

type Props = {
  itemSet: ItemSet;
  placedItems: PlacedItem[];
  index: number;
};

const ItemPane: FC<Props> = (props) => {
  const { itemSet, placedItems, index } = props;
  const [widthStr, setWidthStr] = useState(itemSet.item.width.toString());
  const [heightStr, setHeightStr] = useState(itemSet.item.height.toString());
  const [countStr, setCountStr] = useState(itemSet.count.toString());
  const color = [red, green, blue][(index - 1) % 3];

  const onWidthChange = (event: SelectChangeEvent) => {
    setWidthStr(event.target.value);
  };

  const onHeightChange = (event: SelectChangeEvent) => {
    setHeightStr(event.target.value);
  };

  const onCountChange = (event: SelectChangeEvent) => {
    setCountStr(event.target.value);
  };

  return (
    <>
      <Card>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: color[400] }} aria-label="recipe">
              {' '}
            </Avatar>
          }
          title={<Typography variant="h4">{`Item ${index}`}</Typography>}
        />
        <CardContent>
          <Box display="grid" gridTemplateColumns="repeat(3, 100px)" gap={2}>
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
                  onRemove={() => {}}
                />
              </Box>
            ))}

            <Box gridColumn="1 / 4">
              <Button variant="contained" fullWidth startIcon={<AddIcon />}>
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

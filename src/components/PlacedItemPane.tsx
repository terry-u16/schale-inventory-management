import { type FC, useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import Rotate90DegreesCwIcon from '@mui/icons-material/Rotate90DegreesCw';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import { type PlacedItem } from './ItemPane';
import { getRotatedHeight, getRotatedWidth } from './ItemPane';

type Props = {
  placedItem: PlacedItem;
  index: number;
  onRemove: () => void;
};

const generateSequence = (start: number, end: number) => {
  return Array.from({ length: end - start + 1 }, (_, i) =>
    (start + i).toString(),
  );
};

const PlacedItemPane: FC<Props> = (props) => {
  const { placedItem, onRemove } = props;

  const [rowStr, setRowStr] = useState(placedItem.row.toString());
  const [colStr, setColStr] = useState(placedItem.col.toString());

  const onRowChange = (event: SelectChangeEvent) => {
    setRowStr(event.target.value);
  };

  const onColChange = (event: SelectChangeEvent) => {
    setColStr(event.target.value);
  };

  return (
    <>
      <Paper>
        <Box p={2} display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
          <FormControl fullWidth>
            <InputLabel>行</InputLabel>
            <Select
              labelId={`item-row-${placedItem.item.id}`}
              id={`item-row-${placedItem.item.id}`}
              value={rowStr}
              label="行"
              onChange={onRowChange}
            >
              {generateSequence(1, 5 - getRotatedHeight(placedItem) + 1).map(
                (row) => (
                  <MenuItem
                    value={row}
                    key={`item-row-choice-${placedItem.id}-${row}`}
                  >
                    {row}
                  </MenuItem>
                ),
              )}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>列</InputLabel>
            <Select
              labelId={`item-col-${placedItem.item.id}`}
              id={`item-col-${placedItem.item.id}`}
              value={colStr}
              label="列"
              onChange={onColChange}
            >
              {generateSequence(1, 9 - getRotatedWidth(placedItem) + 1).map(
                (col) => (
                  <MenuItem
                    value={col}
                    key={`item-col-choice-${placedItem.id}-${col}`}
                  >
                    {col}
                  </MenuItem>
                ),
              )}
            </Select>
          </FormControl>

          <ToggleButton value="rotate" selected={placedItem.rotated}>
            <Rotate90DegreesCwIcon />
          </ToggleButton>

          <Button
            value="delete"
            onClick={onRemove}
            color="error"
            variant="contained"
          >
            <DeleteIcon />
          </Button>
        </Box>
      </Paper>
    </>
  );
};

export default PlacedItemPane;

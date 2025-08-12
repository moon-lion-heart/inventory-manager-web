import React, { useState, useEffect } from 'react';
import { Component } from '../../types/component';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import { FilterState } from '../../pages/MainPage';

export interface InventoryFilterProps {
  items: Component[];
  filterState: FilterState;
  updateFilter: (update: Partial<FilterState>) => void;
  onFilter: (category: string, manufacturer: string, name: string) => void;
}

const InventoryFilter: React.FC<InventoryFilterProps> = ({
  items,
  filterState,
  updateFilter,
  onFilter,
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);

  useEffect(() => {
    const uniqueCategories = Array.from(new Set(items.map((item) => item.category)));
    const uniqueManufacturers = Array.from(new Set(items.map((item) => item.manufacturer)));

    setCategories(uniqueCategories);
    setManufacturers(uniqueManufacturers);
  }, [items]);

  const handleFilter = () => {
    onFilter(filterState.category, filterState.manufacturer, filterState.nameKeyword);
  };

  // TextFieldでEnterキーが押されたときのハンドラ
  const handleTextFieldKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleFilter();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      {/* カテゴリー選択 */}
      <FormControl sx={{ width: '18vw' }} size="small">
        <InputLabel id="category-select-label">カテゴリー</InputLabel>
        <Select
          labelId="category-select-label"
          id="category-select"
          value={filterState.category}
          label="カテゴリー"
          onChange={(e: SelectChangeEvent<string>) => {
            updateFilter({ category: e.target.value });
            onFilter(e.target.value, filterState.manufacturer, filterState.nameKeyword);
          }}
          sx={{ backgroundColor: 'white' }}
        >
          <MenuItem value="">すべてのカテゴリー</MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* メーカー選択 */}
      <FormControl sx={{ width: '18vw' }} size="small">
        <InputLabel id="manufacturer-select-label">メーカー</InputLabel>
        <Select
          labelId="manufacturer-select-label"
          id="manufacturer-select"
          value={filterState.manufacturer}
          label="メーカー"
          onChange={(e: SelectChangeEvent<string>) => {
            updateFilter({ manufacturer: e.target.value });
            onFilter(e.target.value, filterState.manufacturer, filterState.nameKeyword);
          }}
          sx={{ backgroundColor: 'white' }}
        >
          <MenuItem value="">すべてのメーカー</MenuItem>
          {manufacturers.map((manu) => (
            <MenuItem key={manu} value={manu}>
              {manu}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 名称入力 */}
      <TextField
        label="名称を入力"
        variant="outlined"
        size="small"
        value={filterState.nameKeyword}
        onChange={(e) => updateFilter({ nameKeyword: e.target.value })}
        onKeyDown={handleTextFieldKeyDown}
        sx={{ width: '18vw' }}
        InputProps={{
          sx: {
            backgroundColor: 'white',
            borderRadius: 1,
          },
        }}
      />
    </div>
  );
};

export default InventoryFilter;

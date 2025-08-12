import React, { useState } from 'react';
import { ComponentForm, columns } from '../../types/component';
import { ActionMode } from '../../pages/MainPage';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';

interface AddItemFormProps {
  onSubmitItem: (form: ComponentForm) => void; // バックエンドにリクエスト送信、成功後にテーブルに反映させる
  onChangeMode: (mode: ActionMode) => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onSubmitItem, onChangeMode }) => {
  const [form, setForm] = useState<ComponentForm>({
    category: '',
    manufacturer: '',
    name: '',
    type: '',
    model_number: '',
    year: '',
    qty: '',
    storage_area: '',
    assign: '',
    note: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (form.category === '') {
      alert('カテゴリーを入力してください');
      return;
    }
    // year, qtyは半角数字or空しか許可しない
    if (!/^\d+$/.test(form.year) && form.year !== '') {
      alert('製造年は半角数字で入力してください');
      return;
    }
    if (!/^\d+$/.test(form.qty) && form.qty !== '') {
      alert('数量は半角数字で入力してください');
      return;
    }

    onSubmitItem(form);
  };

  return (
    <Paper
      elevation={4}
      sx={{
        top: '64px', // AppBarの高さ（通常 64px）
        position: 'fixed',
        left: '40%',
        width: 280,
        zIndex: 1200, // AppBarより前に出す
        p: 2,
      }}
    >
      <Typography variant="subtitle1" gutterBottom>
        アイテム追加
      </Typography>
      <Box sx={{ display: 'grid', gap: 0.5 }}>
        {Object.entries(form).map(([key, val]) => (
          <TextField
            key={key}
            name={key}
            label={columns.find((col) => col.key === key)!.label}
            value={val}
            onChange={handleChange}
            size="small"
            fullWidth
          />
        ))}
      </Box>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button size="small" onClick={() => onChangeMode('view')}>
          キャンセル
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            handleSubmit();
            onChangeMode('view');
          }}
        >
          追加
        </Button>
      </Box>
    </Paper>
  );
};

export default AddItemForm;

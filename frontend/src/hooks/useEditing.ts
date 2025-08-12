import { useState } from 'react';
import { ActionMode } from '../pages/MainPage';

export interface EditingCell {
  rowId: string;
  field: string;
  originalValue: string;
}


export function useEditing(setActionMode: (mode: ActionMode) => void) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [inputValue, setInputValue] = useState('');

  const startEditing = (rowId: string, field: string, value: string) => {
    setEditingCell({ rowId, field, originalValue: value });
    setInputValue(value);
    setActionMode('edit');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setInputValue('');
    setActionMode('view');
  };

  // rowIdはDynamoDBのソートキー
  const confirmEditing = (onConfirm: (rowId: string, field: string, value: string) => void) => {
    if (editingCell === null) return;

    if (editingCell.field === 'year' || editingCell.field === 'qty') {
      if (!/^\d+$/.test(inputValue)) {
        alert('製造年と数量は半角数字で入力してください');
        return;
      }
    }

    if (editingCell.field === 'category' && inputValue === '') {
      alert('カテゴリーに値を入れてください');
      return;
    }

    onConfirm(editingCell.rowId, editingCell.field, inputValue);
    cancelEditing();
  };


  return {
    editingCell,
    inputValue,
    setInputValue,
    startEditing,
    cancelEditing,
    confirmEditing,
  };
}

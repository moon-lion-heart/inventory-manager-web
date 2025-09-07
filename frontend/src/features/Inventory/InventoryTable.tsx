import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import { Component, columns } from '../../types/component';
import { ActionMode } from '../../pages/MainPage';
import { useEditing } from '../../hooks/useEditing';
import { useAuth } from '../../context/AuthContext';

const columnMinWidth = '4vw';

interface InventoryTableProps {
  items: Component[];
  actionMode: ActionMode;
  selectedCategoryItemIds: string[];
  onModeChange: (mode: ActionMode) => void;
  onRowClick: (itemId: string) => void;
  onConfirm: (rowId: string, field: string, newValue: string) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  actionMode,
  selectedCategoryItemIds,
  onModeChange,
  onRowClick,
  onConfirm,
}) => {
  const userInfo = useAuth();

  const { editingCell, inputValue, startEditing, setInputValue, cancelEditing, confirmEditing } =
    useEditing(onModeChange);

  const handleDoubleClick = (itemId: string, field: string, value: string) => {
    if (userInfo.userInfo?.role === 'viewer') return;
    if (actionMode === 'delete') return;
    if (field === 'created_at' || field === 'updated_at') return;
    startEditing(itemId, field, value);
  };

  const isEditingCell = (itemId: string, field: string) => {
    return editingCell?.rowId === itemId && editingCell?.field === field;
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'auto' }}>
      {' '}
      <TableContainer
        component={Paper}
        sx={{
          height: '87vh',
          flexGrow: 1,
          overflow: 'auto',
          borderRadius: '8px',
        }}
      >
        <Table stickyHeader aria-label="inventory table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  sx={{
                    textAlign: 'center',
                    padding: '2px 4px',
                    minWidth: columnMinWidth,
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(224, 224, 224, 1)',
                    backgroundColor: '#cbeaf5ff',
                    fontWeight: 'bold',
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.category_item_id}
                onClick={() => onRowClick(item.category_item_id)}
                sx={{
                  // 削除モードで選択されている行の背景色
                  backgroundColor:
                    actionMode === 'delete' &&
                    selectedCategoryItemIds.includes(item.category_item_id)
                      ? 'error.light' // Material-UIのエラーライトカラー
                      : 'transparent',
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    onDoubleClick={() =>
                      handleDoubleClick(item.category_item_id, column.key, item[column.key])
                    }
                    sx={{
                      minWidth: columnMinWidth,
                      border: '1px solid rgba(224, 224, 224, 1)',
                      padding: '8px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isEditingCell(item.category_item_id, column.key) ? (
                      <TextField
                        variant="outlined"
                        size="small"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmEditing(onConfirm);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        onBlur={() => cancelEditing()}
                        autoFocus
                        fullWidth // 編集中のセルを除くカラムの値の最大幅に合わせる
                        sx={{ maxWidth: '30vw' }}
                      />
                    ) : (
                      (item[column.key] as string | number)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default InventoryTable;

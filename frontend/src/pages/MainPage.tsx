import React, { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import HeaderBar from '../components/HeaderBar';
import Sidebar from '../components/Sidebar';
import DeleteButton from '../components/DeleteButton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import InventoryTable from '../features/Inventory/InventoryTable';
import AddItemForm from '../features/Inventory/AddItemForm';
import { useComponent } from '../hooks/useComponent';
import { devLog } from '../utils/logger';

export type ActionMode = 'view' | 'edit' | 'delete' | 'add';

export type FilterState = {
  category: string;
  manufacturer: string;
  nameKeyword: string;
};

const MainPage: React.FC = () => {
  const { signOut } = useAuthenticator((context) => [context.user]);
  const [actionMode, setActionMode] = useState<ActionMode>('view');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategoryItemIds, setselectedCategoryItemIds] = useState<string[]>([]);
  const [filterState, setFilterState] = useState<FilterState>({
    category: '',
    manufacturer: '',
    nameKeyword: '',
  });

  const {
    filteredItems,
    loading,
    error,
    addItem,
    deleteItems,
    updateItem,
    filterByCategoryManufacturerName,
  } = useComponent();

  const handleActionModeChange = (newMode: ActionMode) => {
    if (actionMode === 'edit' && newMode !== 'view') return;
    devLog(`Action mode changed ${actionMode} to ${newMode === actionMode ? 'view' : newMode}`);
    setActionMode((prev) => (prev === newMode ? 'view' : newMode));
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSelectedCategoryItem = (itemId: string) => {
    if (actionMode !== 'delete') return;
    setselectedCategoryItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  };

  const handleToggleDeleteMode = () => {
    setselectedCategoryItemIds([]); // 削除対象初期化
  };

  const handleDelete = () => {
    if (selectedCategoryItemIds.length === 0) {
      alert('削除する行を選択してください。');
      return;
    }
    devLog('削除するID一覧:', selectedCategoryItemIds);
    deleteItems(selectedCategoryItemIds);
    handleActionModeChange('view');
  };

  const updateFilter = (update: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...update }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {
        <HeaderBar
          onLogout={signOut}
          onModeChange={handleActionModeChange}
          onToggleDeleteMode={handleToggleDeleteMode}
          onToggleSidebar={handleToggleSidebar}
          isSidebarOpen={false}
          filterProps={{
            items: filteredItems,
            filterState,
            updateFilter,
            onFilter: filterByCategoryManufacturerName,
          }}
        />
      }

      <Sidebar isOpen={isSidebarOpen} onClose={handleToggleSidebar} />

      {/* 在庫追加ボタンクリックでアイテム追加フォーム表示 */}
      {actionMode === 'add' && (
        <AddItemForm onSubmitItem={addItem} onChangeMode={handleActionModeChange} />
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 1, // padding これは画面上下左右幅からの余白。上はheaderからの余白
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar /> {/* Toolbarを入れてAppBarとの重なりを回避 */}
        {loading && <LoadingOverlay message="読み込み中..." />}
        {error && <p style={{ color: 'red' }}>エラー: {error}</p>}
        <InventoryTable
          items={filteredItems}
          actionMode={actionMode}
          selectedCategoryItemIds={selectedCategoryItemIds}
          onModeChange={handleActionModeChange}
          onRowClick={toggleSelectedCategoryItem}
          onConfirm={(rowId, field, newValue) => {
            updateItem(rowId, field, newValue);
          }}
        />
      </Box>

      {/* 削除実行ボタン */}
      {actionMode === 'delete' && (
        <DeleteButton selectedIds={selectedCategoryItemIds} onDelete={handleDelete} />
      )}
    </Box>
  );
};

export default MainPage;

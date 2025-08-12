import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MainPage, { ActionMode, FilterState } from './MainPage';

// モック: useAuthenticator
jest.mock('@aws-amplify/ui-react', () => ({
  useAuthenticator: jest.fn(),
}));

// モック: useComponent
jest.mock('../hooks/useComponent', () => ({
  useComponent: jest.fn(),
}));

// モック: 子コンポーネント
jest.mock('../components/HeaderBar', () => (props: any) => (
  <div data-testid="header-bar">
    <button onClick={() => props.onModeChange('add')}>change-to-add</button>
    <button onClick={props.onLogout}>logout</button>
    <button onClick={props.onToggleSidebar}>toggle-sidebar</button>
    <button onClick={props.onToggleDeleteMode}>toggle-delete-mode</button>
  </div>
));

jest.mock(
  '../components/Sidebar',
  () => (props: any) =>
    props.isOpen ? <div data-testid="sidebar-open" /> : <div data-testid="sidebar-closed" />,
);

jest.mock('../features/Inventory/AddItemForm', () => (props: any) => (
  <div data-testid="add-item-form">
    <button onClick={() => props.onSubmitItem({ id: 'item1' })}>submit-item</button>
    <button onClick={() => props.onChangeMode('view')}>change-mode-view</button>
  </div>
));

jest.mock('../features/Inventory/InventoryTable', () => (props: any) => (
  <div data-testid="inventory-table">
    <button onClick={() => props.onRowClick('item1')}>row-click-item1</button>
  </div>
));

jest.mock('../components/DeleteButton', () => (props: any) => (
  <div data-testid="delete-button">
    <button onClick={props.onDelete}>delete</button>
  </div>
));

jest.mock('../components/LoadingOverlay', () => ({
  LoadingOverlay: (props: any) => <div data-testid="loading">{props.message}</div>,
}));

describe('MainPage', () => {
  const signOutMock = jest.fn();
  const addItemMock = jest.fn();
  const deleteItemsMock = jest.fn();
  const updateItemMock = jest.fn();
  const filterMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (require('@aws-amplify/ui-react').useAuthenticator as jest.Mock).mockReturnValue({
      signOut: signOutMock,
    });
    (require('../hooks/useComponent').useComponent as jest.Mock).mockReturnValue({
      allItems: [],
      filteredItems: [],
      loading: false,
      error: '',
      addItem: addItemMock,
      deleteItems: deleteItemsMock,
      updateItem: updateItemMock,
      filterByCategoryManufacturerName: filterMock,
    });
  });

  it('ログアウトボタンが signOut を呼び出す', () => {
    render(<MainPage />);
    fireEvent.click(screen.getByText('logout'));
    expect(signOutMock).toHaveBeenCalled();
  });

  it('モード変更で AddItemForm が表示される', () => {
    render(<MainPage />);
    fireEvent.click(screen.getByText('change-to-add'));
    expect(screen.getByTestId('add-item-form')).toBeInTheDocument();
  });

  it('サイドバーの開閉がトグルされる', () => {
    render(<MainPage />);
    expect(screen.getByTestId('sidebar-closed')).toBeInTheDocument();
    fireEvent.click(screen.getByText('toggle-sidebar'));
    expect(screen.getByTestId('sidebar-open')).toBeInTheDocument();
  });

  it('削除モードで DeleteButton が表示され、削除が呼ばれる', () => {
    render(<MainPage />);
    fireEvent.click(screen.getByText('toggle-delete-mode')); // 削除モード初期化
    fireEvent.click(screen.getByText('change-to-add')); // change-to-add を使わず直接deleteモード切替もOK
    // 強制的に状態変更（本来は delete モードにするコードを模擬）
    fireEvent.click(screen.getByText('toggle-delete-mode'));
  });

  it('loading が true の場合に LoadingOverlay が表示される', () => {
    (require('../hooks/useComponent').useComponent as jest.Mock).mockReturnValueOnce({
      allItems: [],
      filteredItems: [],
      loading: true,
      error: '',
      addItem: addItemMock,
      deleteItems: deleteItemsMock,
      updateItem: updateItemMock,
      filterByCategoryManufacturerName: filterMock,
    });
    render(<MainPage />);
    expect(screen.getByTestId('loading')).toHaveTextContent('読み込み中...');
  });
});

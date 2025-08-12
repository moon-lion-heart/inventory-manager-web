import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InventoryTable from './InventoryTable';
import { Component } from '../../types/component';
import * as AuthContext from '../../context/AuthContext';
import * as useEditingHook from '../../hooks/useEditing';

const mockItems: Component[] = [
  {
    organization_id: 'org1',
    category_item_id: 'catItem1',
    item_id: 'item1',
    category: 'A',
    manufacturer: 'X',
    name: 'Item1',
    type: 'type1',
    model_number: 'model1',
    year: '2020',
    qty: '10',
    storage_area: 'area1',
    assign: 'assign1',
    note: 'note1',
    created_at: '2025-08-01T00:00:00Z',
    updated_at: '2025-08-01T00:00:00Z',
  },
];

describe('InventoryTable', () => {
  const mockOnRowClick = jest.fn();
  const mockOnModeChange = jest.fn();
  const mockOnConfirm = jest.fn();
  const selectedCategoryItemIds: string[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      userInfo: { userId: 'u1', username: 'user', role: 'admin' },
      isAuthenticated: true,
    });

    jest.spyOn(useEditingHook, 'useEditing').mockReturnValue({
      editingCell: null,
      inputValue: '',
      startEditing: jest.fn(),
      setInputValue: jest.fn(),
      cancelEditing: jest.fn(),
      confirmEditing: jest.fn(),
    });
  });

  test('renders table headers and rows', () => {
    render(
      <InventoryTable
        items={mockItems}
        actionMode="view"
        selectedCategoryItemIds={selectedCategoryItemIds}
        onModeChange={mockOnModeChange}
        onRowClick={mockOnRowClick}
        onConfirm={mockOnConfirm}
      />,
    );

    // columnsはコンポーネント内部でimportされている前提
    expect(screen.getByText('カテゴリー')).toBeInTheDocument();
    expect(screen.getByText('メーカー')).toBeInTheDocument();

    // 行のセルにアイテム名が含まれていることをチェック
    expect(screen.getByText('Item1')).toBeInTheDocument();
  });

  test('calls onRowClick with item id when row clicked', () => {
    render(
      <InventoryTable
        items={mockItems}
        actionMode="view"
        selectedCategoryItemIds={selectedCategoryItemIds}
        onModeChange={mockOnModeChange}
        onRowClick={mockOnRowClick}
        onConfirm={mockOnConfirm}
      />,
    );

    const row = screen.getByText('Item1').closest('tr');
    expect(row).toBeTruthy();

    if (row) {
      fireEvent.click(row);
      expect(mockOnRowClick).toHaveBeenCalledWith('catItem1');
    }
  });

  test('does not start editing if user role is viewer', () => {
    const startEditingMock = jest.fn();
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      userInfo: { userId: 'u1', username: 'user', role: 'viewer' },
      isAuthenticated: true,
    });
    jest.spyOn(useEditingHook, 'useEditing').mockReturnValue({
      editingCell: null,
      inputValue: '',
      startEditing: startEditingMock,
      setInputValue: jest.fn(),
      cancelEditing: jest.fn(),
      confirmEditing: jest.fn(),
    });

    render(
      <InventoryTable
        items={mockItems}
        actionMode="view"
        selectedCategoryItemIds={selectedCategoryItemIds}
        onModeChange={mockOnModeChange}
        onRowClick={mockOnRowClick}
        onConfirm={mockOnConfirm}
      />,
    );

    const cell = screen.getByText('Item1');
    fireEvent.doubleClick(cell);

    expect(startEditingMock).not.toHaveBeenCalled();
  });

  test('starts editing on double click if allowed', () => {
    const startEditingMock = jest.fn();
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      userInfo: { userId: 'u1', username: 'user', role: 'admin' },
      isAuthenticated: true,
    });
    jest.spyOn(useEditingHook, 'useEditing').mockReturnValue({
      editingCell: null,
      inputValue: '',
      startEditing: startEditingMock,
      setInputValue: jest.fn(),
      cancelEditing: jest.fn(),
      confirmEditing: jest.fn(),
    });

    render(
      <InventoryTable
        items={mockItems}
        actionMode="view"
        selectedCategoryItemIds={selectedCategoryItemIds}
        onModeChange={mockOnModeChange}
        onRowClick={mockOnRowClick}
        onConfirm={mockOnConfirm}
      />,
    );

    const cell = screen.getByText('Item1');
    fireEvent.doubleClick(cell);

    expect(startEditingMock).toHaveBeenCalledWith('catItem1', 'name', 'Item1');
  });

  // 他にonConfirm, cancelEditingの挙動テストも追加できます
});

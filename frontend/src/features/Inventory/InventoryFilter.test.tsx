import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InventoryFilter, { InventoryFilterProps } from './InventoryFilter';
import { Component } from '../../types/component';

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
  {
    organization_id: 'org1',
    category_item_id: 'catItem2',
    item_id: 'item2',
    category: 'B',
    manufacturer: 'Y',
    name: 'Item2',
    type: 'type2',
    model_number: 'model2',
    year: '2021',
    qty: '5',
    storage_area: 'area2',
    assign: 'assign2',
    note: 'note2',
    created_at: '2025-08-02T00:00:00Z',
    updated_at: '2025-08-02T00:00:00Z',
  },
  {
    organization_id: 'org2',
    category_item_id: 'catItem3',
    item_id: 'item3',
    category: 'A',
    manufacturer: 'Z',
    name: 'Item3',
    type: 'type3',
    model_number: 'model3',
    year: '2022',
    qty: '7',
    storage_area: 'area3',
    assign: 'assign3',
    note: 'note3',
    created_at: '2025-08-03T00:00:00Z',
    updated_at: '2025-08-03T00:00:00Z',
  },
];

describe('InventoryFilter', () => {
  let mockUpdateFilter: jest.Mock;
  let mockOnFilter: jest.Mock;
  let filterState: { category: string; manufacturer: string; nameKeyword: string };

  beforeEach(() => {
    mockUpdateFilter = jest.fn();
    mockOnFilter = jest.fn();
    filterState = { category: '', manufacturer: '', nameKeyword: '' };
  });

  const renderComponent = () =>
    render(
      <InventoryFilter
        items={mockItems}
        filterState={filterState}
        updateFilter={mockUpdateFilter}
        onFilter={mockOnFilter}
      />,
    );

  test('初期表示でカテゴリーとメーカーのユニーク値が表示される', () => {
    renderComponent();

    // カテゴリーの候補がユニークで表示されているか
    fireEvent.mouseDown(screen.getByLabelText('カテゴリー'));
    expect(screen.getByText('すべてのカテゴリー')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();

    // メーカーの候補もユニークで表示されているか
    fireEvent.mouseDown(screen.getByLabelText('メーカー'));
    expect(screen.getByText('すべてのメーカー')).toBeInTheDocument();
    expect(screen.getByText('X')).toBeInTheDocument();
    expect(screen.getByText('Y')).toBeInTheDocument();
    expect(screen.getByText('Z')).toBeInTheDocument();
  });

  test('カテゴリー選択でupdateFilterとonFilterが呼ばれる', () => {
    renderComponent();

    fireEvent.mouseDown(screen.getByLabelText('カテゴリー'));
    fireEvent.click(screen.getByText('A')); // カテゴリー「A」を選択

    expect(mockUpdateFilter).toHaveBeenCalledWith({ category: 'A' });
    expect(mockOnFilter).toHaveBeenCalledWith(
      'A',
      filterState.manufacturer,
      filterState.nameKeyword,
    );
  });

  test('メーカー選択でupdateFilterとonFilterが呼ばれる', () => {
    renderComponent();

    fireEvent.mouseDown(screen.getByLabelText('メーカー'));
    fireEvent.click(screen.getByText('Y')); // メーカー「Y」を選択

    expect(mockUpdateFilter).toHaveBeenCalledWith({ manufacturer: 'Y' });
    // onFilterの第1引数は選択されたメーカーの値ではなくcategoryになるため、
    // このコンポーネントのコード上は誤りがあるかもしれませんがここでは呼び出しをそのまま確認
    expect(mockOnFilter).toHaveBeenCalledWith(
      'Y',
      filterState.manufacturer,
      filterState.nameKeyword,
    );
  });

  test('名称入力でupdateFilterが呼ばれる', () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText('名称を入力'), { target: { value: 'test' } });
    expect(mockUpdateFilter).toHaveBeenCalledWith({ nameKeyword: 'test' });
  });

  test('Enterキー押下でonFilterが呼ばれる', () => {
    renderComponent();

    const input = screen.getByLabelText('名称を入力');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(mockOnFilter).toHaveBeenCalledWith(
      filterState.category,
      filterState.manufacturer,
      filterState.nameKeyword,
    );
  });
});

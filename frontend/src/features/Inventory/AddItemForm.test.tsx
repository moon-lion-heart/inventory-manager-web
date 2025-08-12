// AddItemForm.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AddItemForm from './AddItemForm';
import { ComponentForm, columns } from '../../types/component';

describe('AddItemForm', () => {
  const mockOnSubmitItem = jest.fn();
  const mockOnChangeMode = jest.fn();
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  const fillForm = (values: Partial<ComponentForm>) => {
    Object.entries(values).forEach(([key, val]) => {
      const label = columns.find((col) => col.key === key)!.label;
      fireEvent.change(screen.getByLabelText(label), {
        target: { name: key, value: val },
      });
    });
  };

  test('カテゴリー未入力で追加時に alert が呼ばれる', () => {
    render(<AddItemForm onSubmitItem={mockOnSubmitItem} onChangeMode={mockOnChangeMode} />);

    fireEvent.click(screen.getByText('追加'));
    expect(alertSpy).toHaveBeenCalledWith('カテゴリーを入力してください');
    expect(mockOnSubmitItem).not.toHaveBeenCalled();
  });

  test('year が数字以外で追加時に alert が呼ばれる', () => {
    render(<AddItemForm onSubmitItem={mockOnSubmitItem} onChangeMode={mockOnChangeMode} />);

    fillForm({ category: 'cat1', year: 'abcd' });
    fireEvent.click(screen.getByText('追加'));
    expect(alertSpy).toHaveBeenCalledWith('製造年は半角数字で入力してください');
    expect(mockOnSubmitItem).not.toHaveBeenCalled();
  });

  test('qty が数字以外で追加時に alert が呼ばれる', () => {
    render(<AddItemForm onSubmitItem={mockOnSubmitItem} onChangeMode={mockOnChangeMode} />);

    fillForm({ category: 'cat1', year: '2020', qty: 'xx' });
    fireEvent.click(screen.getByText('追加'));
    expect(alertSpy).toHaveBeenCalledWith('数量は半角数字で入力してください');
    expect(mockOnSubmitItem).not.toHaveBeenCalled();
  });

  test('正しい入力で追加時に onSubmitItem が呼ばれる', () => {
    render(<AddItemForm onSubmitItem={mockOnSubmitItem} onChangeMode={mockOnChangeMode} />);

    fillForm({
      category: 'cat1',
      manufacturer: 'm1',
      name: 'n1',
      type: 't1',
      model_number: 'mn1',
      year: '2023',
      qty: '10',
      storage_area: 's1',
      assign: 'a1',
      note: 'note',
    });

    fireEvent.click(screen.getByText('追加'));

    expect(mockOnSubmitItem).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'cat1',
        year: '2023',
        qty: '10',
      }),
    );
    expect(mockOnChangeMode).toHaveBeenCalledWith('view');
  });

  test('キャンセルボタンで onChangeMode("view") が呼ばれる', () => {
    render(<AddItemForm onSubmitItem={mockOnSubmitItem} onChangeMode={mockOnChangeMode} />);

    fireEvent.click(screen.getByText('キャンセル'));
    expect(mockOnChangeMode).toHaveBeenCalledWith('view');
  });
});

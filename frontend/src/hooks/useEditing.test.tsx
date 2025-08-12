import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useEditing } from './useEditing'; // パスは適宜調整してください
import { ActionMode } from '../pages/MainPage';

describe('useEditing hook', () => {
  const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

  // テスト用コンポーネントを作る
  function TestComponent({ onConfirm }: { onConfirm: jest.Mock }) {
    const [actionMode, setActionMode] = React.useState<ActionMode>('view');
    const { editingCell, inputValue, setInputValue, startEditing, cancelEditing, confirmEditing } =
      useEditing(setActionMode);

    return (
      <div>
        <button
          onClick={() => startEditing('row1', 'category', 'initial')}
          data-testid="start-edit"
        >
          Start Edit
        </button>

        {editingCell ? (
          <>
            <input
              aria-label="edit-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmEditing(onConfirm);
                if (e.key === 'Escape') cancelEditing();
              }}
            />
            <button onClick={() => cancelEditing()} data-testid="cancel-btn">
              Cancel
            </button>
          </>
        ) : (
          <span>No editing</span>
        )}

        <div data-testid="action-mode">{actionMode}</div>
      </div>
    );
  }

  afterEach(() => {
    alertMock.mockClear();
  });

  afterAll(() => {
    alertMock.mockRestore();
  });

  test('startEditing sets editing cell and action mode', () => {
    const onConfirm = jest.fn();
    render(<TestComponent onConfirm={onConfirm} />);

    const startBtn = screen.getByTestId('start-edit');
    fireEvent.click(startBtn);

    const input = screen.getByLabelText('edit-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('initial');

    const mode = screen.getByTestId('action-mode');
    expect(mode.textContent).toBe('edit');
  });

  test('cancelEditing resets editing cell and action mode', () => {
    const onConfirm = jest.fn();
    render(<TestComponent onConfirm={onConfirm} />);

    fireEvent.click(screen.getByTestId('start-edit'));
    fireEvent.click(screen.getByTestId('cancel-btn'));

    expect(screen.queryByLabelText('edit-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('action-mode').textContent).toBe('view');
  });

  test('confirmEditing calls onConfirm with valid input and resets state', () => {
    const onConfirm = jest.fn();
    render(<TestComponent onConfirm={onConfirm} />);

    fireEvent.click(screen.getByTestId('start-edit'));

    const input = screen.getByLabelText('edit-input');
    fireEvent.change(input, { target: { value: 'newCategory' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onConfirm).toHaveBeenCalledWith('row1', 'category', 'newCategory');
    expect(screen.queryByLabelText('edit-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('action-mode').textContent).toBe('view');
  });

  test('confirmEditing shows alert if year or qty is not numeric', () => {
    const onConfirm = jest.fn();

    function TestYearQty({ field }: { field: 'year' | 'qty' }) {
      const [actionMode, setActionMode] = React.useState<ActionMode>('view');
      const { editingCell, inputValue, setInputValue, startEditing, confirmEditing } =
        useEditing(setActionMode);

      React.useEffect(() => {
        startEditing('row1', field, '123');
      }, [field]);

      return (
        <input
          aria-label="edit-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmEditing(onConfirm);
          }}
        />
      );
    }

    const { rerender } = render(<TestYearQty field="year" />);
    let input = screen.getByLabelText('edit-input');
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(alertMock).toHaveBeenCalledWith('製造年と数量は半角数字で入力してください');
    expect(onConfirm).not.toHaveBeenCalled();

    alertMock.mockClear();

    rerender(<TestYearQty field="qty" />);
    input = screen.getByLabelText('edit-input');
    fireEvent.change(input, { target: { value: '12a' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(alertMock).toHaveBeenCalledWith('製造年と数量は半角数字で入力してください');
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('confirmEditing shows alert if category is empty', () => {
    const onConfirm = jest.fn();
    render(<TestComponent onConfirm={onConfirm} />);

    fireEvent.click(screen.getByTestId('start-edit'));
    const input = screen.getByLabelText('edit-input');

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(alertMock).toHaveBeenCalledWith('カテゴリーに値を入れてください');
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

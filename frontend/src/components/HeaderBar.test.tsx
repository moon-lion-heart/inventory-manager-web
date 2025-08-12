import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HeaderBar from './HeaderBar';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { InventoryFilterProps } from '../features/Inventory/InventoryFilter';
import { useNavigate } from 'react-router-dom';

jest.mock('../context/AuthContext');
jest.mock('../context/OrganizationContext');
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('HeaderBar', () => {
  const mockOnLogout = jest.fn();
  const mockOnModeChange = jest.fn();
  const mockOnToggleDeleteMode = jest.fn();
  const mockOnToggleSidebar = jest.fn();
  const mockNavigate = jest.fn();

  const mockFilterProps: InventoryFilterProps = {
    items: [],
    filterState: { category: '', manufacturer: '', nameKeyword: '' },
    updateFilter: jest.fn(),
    onFilter: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useAuth as jest.Mock).mockReturnValue({
      userInfo: { username: 'federer', role: 'admin' },
    });
    (useOrganization as jest.Mock).mockReturnValue({
      orgInfo: { organization_id: 'org1', organization_name: '組織名' },
    });
  });

  test('renders username initial and role label', () => {
    render(
      <HeaderBar
        onLogout={mockOnLogout}
        onModeChange={mockOnModeChange}
        onToggleDeleteMode={mockOnToggleDeleteMode}
        onToggleSidebar={mockOnToggleSidebar}
        isSidebarOpen={false}
        filterProps={mockFilterProps}
      />,
    );
    expect(screen.getByText('在庫管理アプリ')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument(); // Avatarの頭文字
  });

  test('calls onModeChange and onToggleDeleteMode when delete button clicked', () => {
    render(
      <HeaderBar
        onLogout={mockOnLogout}
        onModeChange={mockOnModeChange}
        onToggleDeleteMode={mockOnToggleDeleteMode}
        onToggleSidebar={mockOnToggleSidebar}
        isSidebarOpen={false}
        filterProps={mockFilterProps}
      />,
    );

    fireEvent.click(screen.getByLabelText('delete item'));
    expect(mockOnModeChange).toHaveBeenCalledWith('delete');
    expect(mockOnToggleDeleteMode).toHaveBeenCalled();
  });

  test('calls onLogout and navigate on logout button click', async () => {
    (mockOnLogout as jest.Mock).mockResolvedValueOnce(undefined);

    render(
      <HeaderBar
        onLogout={mockOnLogout}
        onModeChange={mockOnModeChange}
        onToggleDeleteMode={mockOnToggleDeleteMode}
        onToggleSidebar={mockOnToggleSidebar}
        isSidebarOpen={false}
        filterProps={mockFilterProps}
      />,
    );

    fireEvent.click(screen.getByLabelText('logout'));

    await waitFor(() => {
      expect(mockOnLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });
  });

  test('calls onToggleSidebar when menu icon clicked', () => {
    render(
      <HeaderBar
        onLogout={mockOnLogout}
        onModeChange={mockOnModeChange}
        onToggleDeleteMode={mockOnToggleDeleteMode}
        onToggleSidebar={mockOnToggleSidebar}
        isSidebarOpen={false}
        filterProps={mockFilterProps}
      />,
    );

    fireEvent.click(screen.getByLabelText('open drawer'));
    expect(mockOnToggleSidebar).toHaveBeenCalled();
  });

  test('displays add/delete buttons only for admin/editor roles', () => {
    (useAuth as jest.Mock).mockReturnValueOnce({
      userInfo: { username: 'user1', role: 'viewer' },
    });

    const { rerender } = render(
      <HeaderBar
        onLogout={mockOnLogout}
        onModeChange={mockOnModeChange}
        onToggleDeleteMode={mockOnToggleDeleteMode}
        onToggleSidebar={mockOnToggleSidebar}
        isSidebarOpen={false}
        filterProps={mockFilterProps}
      />,
    );

    expect(screen.queryByLabelText('add item')).toBeNull();
    expect(screen.queryByLabelText('delete item')).toBeNull();

    // admin role
    (useAuth as jest.Mock).mockReturnValueOnce({
      userInfo: { username: 'user2', role: 'admin' },
    });

    rerender(
      <HeaderBar
        onLogout={mockOnLogout}
        onModeChange={mockOnModeChange}
        onToggleDeleteMode={mockOnToggleDeleteMode}
        onToggleSidebar={mockOnToggleSidebar}
        isSidebarOpen={false}
        filterProps={mockFilterProps}
      />,
    );

    expect(screen.getByLabelText('add item')).toBeInTheDocument();
    expect(screen.getByLabelText('delete item')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RegisterOrganizationPage from './RegisterOrganizationPage';
import { useNavigate } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('RegisterOrganizationPage', () => {
  const navigateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(navigateMock);
  });

  it('画面のテキストとボタンが表示されている', () => {
    render(<RegisterOrganizationPage />);
    expect(screen.getByText('組織への参加方法を選んでください')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '新しく組織を作成する' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '既存の組織に参加する' })).toBeInTheDocument();
  });

  it('「新しく組織を作成する」ボタン押下で正しいパスに遷移する', () => {
    render(<RegisterOrganizationPage />);
    fireEvent.click(screen.getByRole('button', { name: '新しく組織を作成する' }));
    expect(navigateMock).toHaveBeenCalledWith('/register-organization/create');
  });

  it('「既存の組織に参加する」ボタン押下で正しいパスに遷移する', () => {
    render(<RegisterOrganizationPage />);
    fireEvent.click(screen.getByRole('button', { name: '既存の組織に参加する' }));
    expect(navigateMock).toHaveBeenCalledWith('/register-organization/join');
  });
});

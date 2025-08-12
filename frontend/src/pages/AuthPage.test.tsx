import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import AuthPage from './AuthPage';

// useNavigate のモック
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Amplify useAuthenticator のモック
jest.mock('@aws-amplify/ui-react', () => ({
  ...jest.requireActual('@aws-amplify/ui-react'),
  useAuthenticator: jest.fn(),
  Authenticator: ({ children }: any) => <div>{children}</div>,
}));

describe('AuthPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('user が存在しない場合、LoadingOverlay を表示', () => {
    const { useAuthenticator } = require('@aws-amplify/ui-react');
    useAuthenticator.mockImplementation(() => ({ user: null }));

    render(<AuthPage />);
    expect(screen.getByText(/ログイン中です/)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('user が存在する場合、/entry に navigate', async () => {
    const { useAuthenticator } = require('@aws-amplify/ui-react');
    useAuthenticator.mockImplementation(() => ({ user: { username: 'test' } }));

    await act(async () => {
      render(<AuthPage />);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/entry');
  });
});

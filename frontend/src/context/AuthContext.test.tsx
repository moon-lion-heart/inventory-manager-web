import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Amplify hooks と関数をモック
jest.mock('@aws-amplify/ui-react', () => ({
  useAuthenticator: jest.fn(),
}));
jest.mock('aws-amplify/auth', () => ({
  fetchAuthSession: jest.fn(),
}));
jest.mock('../utils/jwt', () => ({
  parseJwt: jest.fn(),
}));
jest.mock('../utils/logger', () => ({
  devLog: jest.fn(),
}));

const mockUseAuthenticator = require('@aws-amplify/ui-react').useAuthenticator;
const mockFetchAuthSession = require('aws-amplify/auth').fetchAuthSession;
const mockParseJwt = require('../utils/jwt').parseJwt;

// テスト用コンポーネント
const TestComponent = () => {
  const { userInfo, isAuthenticated } = useAuth();
  return (
    <div>
      <div>auth: {isAuthenticated ? 'yes' : 'no'}</div>
      <div>username: {userInfo?.username || '-'}</div>
      <div>role: {userInfo?.role || '-'}</div>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('認証済みユーザー情報を提供する', async () => {
    mockUseAuthenticator.mockReturnValue({ authStatus: 'authenticated' });
    mockFetchAuthSession.mockResolvedValue({
      tokens: { idToken: 'fake-token' },
    });
    mockParseJwt.mockReturnValue({
      sub: 'user-123',
      'cognito:username': 'testuser',
      'cognito:groups': ['admin'],
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/auth: yes/)).toBeInTheDocument();
      expect(screen.getByText(/username: testuser/)).toBeInTheDocument();
      expect(screen.getByText(/role: admin/)).toBeInTheDocument();
    });
  });

  test('未認証の場合は userInfo が null になる', async () => {
    mockUseAuthenticator.mockReturnValue({ authStatus: 'unauthenticated' });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/auth: no/)).toBeInTheDocument();
      expect(screen.getByText(/username: -/)).toBeInTheDocument();
      expect(screen.getByText(/role: -/)).toBeInTheDocument();
    });
  });
});

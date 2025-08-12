// PrivateRoute.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import PrivateRoute from './PrivateRoute';
import { useAuthenticator } from '@aws-amplify/ui-react';

// Navigateは下記のように「jest.fn」ではなく、単純なコンポーネントとして置き換える
jest.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => (
    <div>Redirect to {typeof to === 'string' ? to : JSON.stringify(to)}</div>
  ),
}));

jest.mock('@aws-amplify/ui-react', () => ({
  useAuthenticator: jest.fn(),
}));

describe('PrivateRoute', () => {
  const useAuthenticatorMock = useAuthenticator as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('authStatus が "unauthenticated" のとき /auth にリダイレクトされる', () => {
    useAuthenticatorMock.mockReturnValue({ authStatus: 'unauthenticated' });

    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>,
    );

    expect(screen.getByText('Redirect to /auth')).toBeInTheDocument();
  });

  // 他のテストは省略
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import EntryPoint from './EntryPoint';

// useAuthenticator モック
jest.mock('@aws-amplify/ui-react', () => ({
  ...jest.requireActual('@aws-amplify/ui-react'),
  useAuthenticator: jest.fn(),
}));

// useAuth モック
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// useCheckRegistration モック
jest.mock('../hooks/useCheckRegistration', () => ({
  useCheckRegistration: jest.fn(),
}));

describe('EntryPoint', () => {
  const mockUseAuthenticator = require('@aws-amplify/ui-react').useAuthenticator;
  const mockUseAuth = require('../context/AuthContext').useAuth;
  const mockUseCheckRegistration = require('../hooks/useCheckRegistration').useCheckRegistration;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loading が true の場合、確認中... を表示', () => {
    mockUseAuthenticator.mockReturnValue({ authStatus: 'authenticated', user: {} });
    mockUseAuth.mockReturnValue({ userInfo: { userId: '123' } });
    mockUseCheckRegistration.mockReturnValue(true);

    render(<EntryPoint />);
    expect(screen.getByText(/確認中/)).toBeInTheDocument();
  });

  it('loading が false の場合、何も表示しない', () => {
    mockUseAuthenticator.mockReturnValue({ authStatus: 'authenticated', user: {} });
    mockUseAuth.mockReturnValue({ userInfo: { userId: '123' } });
    mockUseCheckRegistration.mockReturnValue(false);

    const { container } = render(<EntryPoint />);
    expect(container).toBeEmptyDOMElement();
  });
});

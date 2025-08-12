import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RegisterCompletePage from './RegisterCompletePage';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useNavigate } from 'react-router-dom';

// useAuthenticator と useNavigate をモック化
jest.mock('@aws-amplify/ui-react', () => ({
  useAuthenticator: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('RegisterCompletePage', () => {
  const signOutMock = jest.fn();
  const navigateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // useAuthenticator のモック返却値設定
    (useAuthenticator as jest.Mock).mockReturnValue({
      signOut: signOutMock,
    });

    // useNavigate のモック返却値設定
    (useNavigate as jest.Mock).mockReturnValue(navigateMock);
  });

  it('画面のテキストが表示されている', () => {
    render(<RegisterCompletePage />);
    expect(screen.getByText('アカウント登録が完了しました')).toBeInTheDocument();
    expect(screen.getByText('ログインしてサービスをご利用ください。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログインページへ' })).toBeInTheDocument();
  });

  it('「ログインページへ」ボタンを押すと signOut と navigate が呼ばれる', () => {
    render(<RegisterCompletePage />);
    const button = screen.getByRole('button', { name: 'ログインページへ' });

    fireEvent.click(button);

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/auth');
  });
});

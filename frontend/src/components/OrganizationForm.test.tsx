import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrganizationForm from './OrganizationForm';
import { callLambda } from '../api/lambdaApi';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { useNavigate, useParams } from 'react-router-dom';

// --- モック化 ---
jest.mock('../api/lambdaApi');
jest.mock('../context/AuthContext');
jest.mock('../context/OrganizationContext');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

// --- モックの型変換 ---
const callLambdaMock = callLambda as jest.Mock;
const useAuthMock = useAuth as jest.Mock;
const useOrganizationMock = useOrganization as jest.Mock;
const navigateMock = jest.fn();
const setOrgInfoMock = jest.fn();

// --- 各テスト前に初期化 ---
beforeEach(() => {
  jest.clearAllMocks();

  (useParams as jest.Mock).mockReturnValue({ mode: 'create' });
  (useNavigate as jest.Mock).mockReturnValue(navigateMock);

  useAuthMock.mockReturnValue({
    userInfo: { userId: 'user1', username: 'John' },
  });

  useOrganizationMock.mockReturnValue({
    setOrgInfo: setOrgInfoMock,
  });
});

describe('OrganizationForm', () => {
  test('空入力の場合 callLambda は呼ばれずエラー表示', async () => {
    render(<OrganizationForm />);

    fireEvent.click(screen.getByRole('button', { name: /作成する/i }));

    expect(callLambdaMock).not.toHaveBeenCalled();
    expect(await screen.findByText(/組織名を入力してください/i)).toBeInTheDocument();
  });

  test('callLambda 成功時 setOrgInfo と navigate が呼ばれる', async () => {
    callLambdaMock.mockResolvedValue({
      result: 'success',
      user: {
        organization_id: 'org123',
        organization_name: 'テスト組織',
      },
    });

    render(<OrganizationForm />);

    fireEvent.change(screen.getByLabelText(/組織名/i), {
      target: { value: 'テスト組織' },
    });
    fireEvent.click(screen.getByRole('button', { name: /作成する/i }));

    await waitFor(() => {
      expect(callLambdaMock).toHaveBeenCalled();
      expect(setOrgInfoMock).toHaveBeenCalledWith({
        organization_id: 'org123',
        organization_name: 'テスト組織',
      });
      expect(navigateMock).toHaveBeenCalledWith('/register-complete');
    });
  });

  test('callLambda 失敗時 エラーメッセージ表示', async () => {
    callLambdaMock.mockResolvedValue({
      result: 'error',
    });

    render(<OrganizationForm />);

    fireEvent.change(screen.getByLabelText(/組織名/i), {
      target: { value: 'テスト組織' },
    });
    fireEvent.click(screen.getByRole('button', { name: /作成する/i }));

    expect(await screen.findByText(/組織登録に失敗しました/i)).toBeInTheDocument();
  });

  test('callLambda 例外発生時 通信エラー表示', async () => {
    callLambdaMock.mockRejectedValue(new Error('network error'));

    render(<OrganizationForm />);

    fireEvent.change(screen.getByLabelText(/組織名/i), {
      target: { value: 'テスト組織' },
    });
    fireEvent.click(screen.getByRole('button', { name: /作成する/i }));

    expect(await screen.findByText(/通信エラーが発生しました/i)).toBeInTheDocument();
  });
});

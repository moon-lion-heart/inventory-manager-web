import { renderHook, waitFor } from '@testing-library/react';
import { useCheckRegistration } from '../hooks/useCheckRegistration';
import * as lambdaApi from '../api/lambdaApi';
import * as orgContext from '../context/OrganizationContext';
import * as router from 'react-router-dom';

jest.mock('../api/lambdaApi');
jest.mock('../context/OrganizationContext');
jest.mock('react-router-dom');

describe('useCheckRegistration', () => {
  const mockSetOrgInfo = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(orgContext, 'useOrganization').mockReturnValue({
      orgInfo: null,
      setOrgInfo: mockSetOrgInfo,
    });

    jest.spyOn(router, 'useNavigate').mockReturnValue(mockNavigate);
  });

  test('navigates to /main and sets orgInfo on successful response', async () => {
    (lambdaApi.callLambda as jest.Mock).mockResolvedValueOnce({
      result: 'success',
      organization: { organization_id: 'org1', organization_name: 'Org 1' },
    });

    const { result } = renderHook(() =>
      useCheckRegistration({ authStatus: 'authenticated', userId: 'user1' }),
    );

    // loading 初期値は true
    expect(result.current).toBe(true);

    // 非同期処理が終わるのを待つ
    await waitFor(() => expect(result.current).toBe(false));

    expect(lambdaApi.callLambda).toHaveBeenCalledWith(
      process.env.REACT_APP_ORGANIZATION_LAMBDA_URL,
      { value: { user_id: 'user1' } },
    );
    expect(mockSetOrgInfo).toHaveBeenCalledWith({
      organization_id: 'org1',
      organization_name: 'Org 1',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/main');
  });

  test('navigates to /register-organization on failed response', async () => {
    (lambdaApi.callLambda as jest.Mock).mockResolvedValueOnce({
      result: 'fail',
    });

    const { result } = renderHook(() =>
      useCheckRegistration({ authStatus: 'authenticated', userId: 'user1' }),
    );

    await waitFor(() => expect(result.current).toBe(false));

    expect(mockNavigate).toHaveBeenCalledWith('/register-organization');
    expect(mockSetOrgInfo).not.toHaveBeenCalled();
  });

  test('navigates to /auth if unauthenticated', async () => {
    const { result } = renderHook(() => useCheckRegistration({ authStatus: 'unauthenticated' }));

    await waitFor(() => expect(result.current).toBe(false));

    expect(mockNavigate).toHaveBeenCalledWith('/auth');
    expect(mockSetOrgInfo).not.toHaveBeenCalled();
  });

  test('does nothing if authStatus is other and userId undefined', async () => {
    const { result } = renderHook(() => useCheckRegistration({ authStatus: 'loading' }));

    await waitFor(() => expect(result.current).toBe(false));

    expect(lambdaApi.callLambda).not.toHaveBeenCalled();
    expect(mockSetOrgInfo).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

import { callLambda } from './lambdaApi';
import { getValidIdToken } from '../utils/auth';

jest.mock('../utils/auth', () => ({
  getValidIdToken: jest.fn(),
}));

global.fetch = jest.fn();

describe('callLambda', () => {
  const mockEndpoint = 'https://example.com/lambda';
  const mockPayload = { key: 'value' };
  const mockToken = 'mock-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('正常系: fetch が成功し JSON を返す', async () => {
    (getValidIdToken as jest.Mock).mockResolvedValue(mockToken);

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    const result = await callLambda(mockEndpoint, mockPayload);

    expect(getValidIdToken).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(mockEndpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${mockToken}`,
        'content-Type': 'application/json',
      },
      body: JSON.stringify(mockPayload),
    });
    expect(result).toEqual({ success: true });
  });

  test('異常系: トークンが取得できない場合はエラー', async () => {
    (getValidIdToken as jest.Mock).mockResolvedValue(null);

    await expect(callLambda(mockEndpoint, mockPayload)).rejects.toThrow('No valid token found');
  });

  test('異常系: fetch が ok=false の場合はエラー', async () => {
    (getValidIdToken as jest.Mock).mockResolvedValue(mockToken);

    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(callLambda(mockEndpoint, mockPayload)).rejects.toThrow(
      'Request failed with status 500',
    );
  });
});

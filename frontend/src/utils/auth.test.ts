import { getValidIdToken } from './auth';
import { fetchAuthSession } from 'aws-amplify/auth';
import { parseJwt } from './jwt';
import { devLog } from '../utils/logger';

// モック化
jest.mock('aws-amplify/auth', () => ({
  fetchAuthSession: jest.fn(),
}));

jest.mock('./jwt', () => ({
  parseJwt: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
  devLog: jest.fn(),
}));

describe('getValidIdToken', () => {
  const mockedFetchAuthSession = fetchAuthSession as jest.Mock;
  const mockedParseJwt = parseJwt as jest.Mock;
  const mockedDevLog = devLog as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('トークン取得成功時にトークンを返すとともに parseJwt と devLog が呼ばれる', async () => {
    const fakeToken = 'fake.id.token';
    const fakeDecoded = { sub: '1234' };

    mockedFetchAuthSession.mockResolvedValue({
      tokens: { idToken: { toString: () => fakeToken } },
    });

    mockedParseJwt.mockReturnValue(fakeDecoded);

    const result = await getValidIdToken();

    expect(mockedFetchAuthSession).toHaveBeenCalled();
    expect(mockedParseJwt).toHaveBeenCalledWith(fakeToken);
    expect(mockedDevLog).toHaveBeenCalledWith('Decoded token:', fakeDecoded);
    expect(result).toBe(fakeToken);
  });

  it('idToken がない場合は null を返すが parseJwt は呼ばれない', async () => {
    mockedFetchAuthSession.mockResolvedValue({
      tokens: {},
    });

    const result = await getValidIdToken();

    expect(mockedFetchAuthSession).toHaveBeenCalled();
    expect(mockedParseJwt).not.toHaveBeenCalled();
    expect(mockedDevLog).not.toHaveBeenCalledWith(expect.stringContaining('Decoded token'));
    expect(result).toBeNull();
  });

  it('fetchAuthSession で例外が発生した場合は null を返しエラーログが出る', async () => {
    const error = new Error('network error');
    mockedFetchAuthSession.mockRejectedValue(error);

    const result = await getValidIdToken();

    expect(mockedFetchAuthSession).toHaveBeenCalled();
    expect(mockedDevLog).toHaveBeenCalledWith('Failed to refresh token', error);
    expect(result).toBeNull();
  });
});

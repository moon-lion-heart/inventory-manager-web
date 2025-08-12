import { parseJwt } from './jwt';
import { devLog } from './logger';

jest.mock('./logger', () => ({
  devLog: jest.fn(),
}));

describe('parseJwt', () => {
  const mockedDevLog = devLog as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正しいJWTのペイロードをJSONとして返す', () => {
    // ヘッダー、ペイロード、署名のそれぞれBase64URLエンコード文字列を作成
    const payload = { sub: '12345', name: 'test user', iat: 1516239022 };
    const base64UrlPayload = Buffer.from(JSON.stringify(payload))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // ダミーのヘッダーと署名（値はどうでもよい）
    const dummyHeader = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const dummySignature = 'dummy-signature';

    const token = `${dummyHeader}.${base64UrlPayload}.${dummySignature}`;

    const result = parseJwt(token);
    expect(result).toEqual(payload);
  });

  it('不正なJWTを渡すとnullを返し devLog が呼ばれる', () => {
    const badToken = 'invalid.token.string';

    const result = parseJwt(badToken);

    expect(result).toBeNull();
    expect(mockedDevLog).toHaveBeenCalledWith('Failed to parse JWT:', expect.any(Error));
  });
});

import { fetchAuthSession } from 'aws-amplify/auth';
import { devLog } from '../utils/logger';
import { parseJwt } from './jwt';

export const getValidIdToken = async (): Promise<string | null> => {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString() ?? null;
    if (idToken) {
      const decoded = parseJwt(idToken);
      devLog('Decoded token:', decoded);
    }

    return idToken;
  } catch (err) {
    devLog('Failed to refresh token', err);
    return null;
  }
};

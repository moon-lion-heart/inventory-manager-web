import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { devLog } from '../utils/logger';
import { parseJwt } from '../utils/jwt';

type RoleType = 'admin' | 'viewer' | 'editor' | '';

export type UserInfo = {
  userId: string;
  username: string;
  role: RoleType;
};

interface AuthContextType {
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const validRoles: RoleType[] = ['admin', 'editor', 'viewer'];

function parseRole(roleStr: string): RoleType {
  return validRoles.includes(roleStr as RoleType) ? (roleStr as RoleType) : '';
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const isAuthenticated = authStatus === 'authenticated';

  const fetchUserInfo = useCallback(async () => {
    if (!isAuthenticated) {
      setUserInfo(null);
      return;
    }

    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      if (!idToken) {
        devLog('No idToken found in session');
        setUserInfo(null);
        return;
      }

      const decoded = parseJwt(idToken);
      if (!decoded) {
        setUserInfo(null);
        return;
      }

      const groups = decoded['cognito:groups'] as string[] | undefined;
      const roleStr = groups?.[0] || '';
      const role = parseRole(roleStr);

      setUserInfo({
        userId: decoded.sub,
        username: decoded['cognito:username'],
        role,
      });

      devLog('Update user:', decoded['cognito:username']);
    } catch (err) {
      devLog('Failed to fetch user info:', err);
      setUserInfo(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  return (
    <AuthContext.Provider value={{ userInfo, isAuthenticated }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

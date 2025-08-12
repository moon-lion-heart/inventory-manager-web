import { useAuthenticator } from '@aws-amplify/ui-react';
import { useAuth } from '../context/AuthContext';
import { useCheckRegistration } from '../hooks/useCheckRegistration';
import { LoadingOverlay } from '../components/LoadingOverlay';

const EntryPoint = () => {
  const { authStatus } = useAuthenticator((ctx) => [ctx.authStatus, ctx.user]);
  const { userInfo } = useAuth();

  const loading = useCheckRegistration({
    authStatus,
    userId: userInfo?.userId,
  });

  return loading ? <LoadingOverlay message="確認中..." /> : null;
};

export default EntryPoint;

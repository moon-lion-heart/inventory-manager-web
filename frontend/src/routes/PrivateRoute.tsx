import { Navigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { devLog } from '../utils/logger';
import { LoadingOverlay } from '../components/LoadingOverlay';

interface PrivateRouteProps {
  children: React.JSX.Element;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);

  devLog('PrivateRoute authStatus:', authStatus);
  if (authStatus === 'configuring') {
    return <LoadingOverlay message="認証状態を取得中..." />;
  }

  if (authStatus !== 'authenticated') {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default PrivateRoute;

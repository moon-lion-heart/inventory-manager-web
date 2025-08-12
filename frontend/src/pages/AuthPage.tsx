import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { Authenticator } from '@aws-amplify/ui-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useNavigate } from 'react-router-dom';
import { LoadingOverlay } from '../components/LoadingOverlay';

const AuthPage: React.FC = () => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Authenticator signUpAttributes={['email']}>
        <AuthRedirectHandler />
      </Authenticator>
    </Box>
  );
};

const AuthRedirectHandler: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthenticator((context) => [context.user]);

  useEffect(() => {
    if (user) {
      navigate('/entry');
    }
  }, [user, navigate]);

  return <LoadingOverlay message="ログイン中です..." />;
};

export default AuthPage;

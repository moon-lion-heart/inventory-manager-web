import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';

const RegisterCompletePage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuthenticator(context => [context.user]);

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  return (
    <Container maxWidth="sm">
      <Box textAlign="center" mt={10}>
        <Typography variant="h4" gutterBottom>
          アカウント登録が完了しました
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          ログインしてサービスをご利用ください。
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => {
            signOut();
            handleGoToLogin();
          }}
          sx={{ mt: 4 }}
        >
          ログインページへ
        </Button>
      </Box>
    </Container>
  );
};

export default RegisterCompletePage;

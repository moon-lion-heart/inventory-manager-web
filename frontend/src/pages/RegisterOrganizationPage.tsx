import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

const RegisterOrganizationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ maxWidth: 400, margin: '100px auto', textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        組織への参加方法を選んでください
      </Typography>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 3 }}
        fullWidth
        onClick={() => navigate('/register-organization/create')}
      >
        新しく組織を作成する
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        sx={{ mt: 2 }}
        fullWidth
        onClick={() => navigate('/register-organization/join')}
      >
        既存の組織に参加する
      </Button>
    </Box>
  );
};

export default RegisterOrganizationPage;
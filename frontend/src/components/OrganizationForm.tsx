import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Box } from '@mui/material';
import { callLambda } from '../api/lambdaApi';
import { LambdaPayload, UserRegisterResponse } from '../types/lambda';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { devLog } from '../utils/logger';

const OrganizationForm: React.FC = () => {
  const { mode } = useParams(); // 'create' or 'join'
  const isCreateMode = mode === 'create';
  const [organizationInput, setOrganizationInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const organizationInfo = useOrganization();
  const userInfo = useAuth();
  const userId = userInfo.userInfo?.userId || '';
  const username = userInfo.userInfo?.username || '';
  const lambdaUrl = process.env.REACT_APP_USER_LAMBDA_URL as string;

  const validateInput = () => {
    if (!organizationInput) {
      setError(isCreateMode ? '組織名を入力してください' : '組織IDを入力してください');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateInput() || isLoading) return;
    setIsLoading(true);

    try {
      devLog('UserRegister');
      const payload: LambdaPayload = {
        value: {
          user_id: userId,
          username: username,
          mode: isCreateMode ? 'create' : 'join',
          organization_input: organizationInput, // 組織名または組織ID
        },
      };

      const response = await callLambda(lambdaUrl, payload);
      const userRegisterResponse = response as UserRegisterResponse;

      if (userRegisterResponse.result === 'success') {
        organizationInfo.setOrgInfo({
          organization_id: userRegisterResponse.user.organization_id,
          organization_name: userRegisterResponse.user.organization_name,
        });
        navigate('/register-complete');
      } else {
        setError('組織登録に失敗しました');
      }
    } catch (err) {
      devLog(err);
      setError('通信エラーが発生しました');
    }
  };

  return (
    <Box sx={{ maxWidth: 400, margin: '100px auto', textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        {isCreateMode ? '新しい組織を作成' : '既存の組織に参加'}
      </Typography>
      <TextField
        fullWidth
        label={isCreateMode ? '組織名' : '組織ID'}
        value={organizationInput}
        onChange={(e) => setOrganizationInput(e.target.value)}
        margin="normal"
        disabled={isLoading}
      />
      {error && <Typography color="error">{error}</Typography>}
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ mt: 2 }}
        fullWidth
        disabled={isLoading}
      >
        {isCreateMode ? '作成する' : '参加する'}
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => navigate('/register-organization')}
        sx={{ mt: 2 }}
        fullWidth
        disabled={isLoading}
      >
        戻る
      </Button>
    </Box>
  );
};

export default OrganizationForm;

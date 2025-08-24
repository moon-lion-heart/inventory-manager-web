import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { callLambda } from '../api/lambdaApi';
import { LambdaPayload, OrganizationIdGetResponse } from '../types/lambda';
import { useOrganization } from '../context/OrganizationContext';
import { devLog } from '../utils/logger';

type CheckRegistrationParams = {
  authStatus: string;
  userId?: string;
};

export function useCheckRegistration({ authStatus, userId }: CheckRegistrationParams) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const organizationInfo = useOrganization();
  const lambdaUrl = process.env.REACT_APP_ORGANIZATION_LAMBDA_URL!;

  useEffect(() => {
    async function checkRegistration() {
      devLog('checkRegistration: authStatus=', authStatus, 'userId=', userId);

      if (authStatus === 'authenticated' && userId) {
        const payload: LambdaPayload = { value: { user_id: userId } };
        const response = await callLambda(lambdaUrl, payload);
        const orgIdResponse = response as OrganizationIdGetResponse;

        devLog('response', orgIdResponse);

        if (orgIdResponse.result === 'success') {
          organizationInfo.setOrgInfo(orgIdResponse.organization);
          navigate('/main');
        } else {
          navigate('/register-organization');
        }
      } else if (authStatus === 'unauthenticated') {
        navigate('/auth');
      }
      setLoading(false);
    }

    checkRegistration();
    // 依存を入れると無限ループや意図しない再実行になるので無視
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, userId]);

  return loading;
}

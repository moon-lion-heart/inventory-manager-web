import { LambdaPayload, LambdaResponse } from '../types/lambda';
import { getValidIdToken } from '../utils/auth';
import { devLog } from '../utils/logger';

export async function callLambda(
  endpoint: string,
  payload: LambdaPayload,
): Promise<LambdaResponse> {
  devLog('Sending request to Lambda:', payload);

  const token = await getValidIdToken();
  if (!token) {
    throw new Error('No valid token found');
  }

  const response = await fetch(endpoint!, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data;
}

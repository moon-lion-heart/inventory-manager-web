const awsmobile = {
    "aws_project_region": process.env.REACT_APP_AWS_PROJECT_REGION,
    "aws_cognito_identity_pool_id": "", // Cognito Identity Pool の ID。　未使用なので空
    "aws_cognito_region": process.env.REACT_APP_AWS_COGNITO_REGION,
    "aws_user_pools_id": process.env.REACT_APP_AWS_USER_POOLS_ID,
    "aws_user_pools_web_client_id": process.env.REACT_APP_AWS_USER_POOLS_WEB_CLIENT_ID,

    // Lambda 関数を直接呼び出すためのAPI設定
    "aws_cloud_logic_custom": [
        {
            "name": process.env.REACT_APP_API_NAME,
            // Lambda Function URL の URL を指定
            // ただし、Amplify.API を使って Lambda を直接呼び出す場合は、
            // Lambda の Invoke URL (arn:aws:lambda:...) を使用します。
            // これにより、Amplify が自動的に認証情報を付与してくれます。
            // フォーマット: https://lambda.{region}.amazonaws.com/2015-03-31/functions/{LambdaFunctionNameOrArn}/invocations
            "endpoint": process.env.REACT_APP_API_ENDPOINT,
            "region": process.env.REACT_APP_API_REGION,
            // 同期呼び出しであることを明示
            "custom_header": async () => {
                return { "X-Amz-Invocation-Type": "RequestResponse" };
            }
        }
    ]
};

export default awsmobile;
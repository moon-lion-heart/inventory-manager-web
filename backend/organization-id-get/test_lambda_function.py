import pytest
import json
from unittest.mock import patch, MagicMock
import os

# 環境変数セット（テスト開始前に）
os.environ['REGION_NAME'] = 'ap-northeast-1'
os.environ['COGNITO_USER_POOL_ID'] = 'dummy_pool_id'
os.environ['COGNITO_APP_CLIENT_ID'] = 'dummy_app_client_id'
os.environ['TABLE1_NAME'] = 'users'
os.environ['TABLE1_PK_NAME'] = 'user_id'
os.environ['TABLE1_FIELD_TYPES'] = json.dumps({'user_id': 'S', 'organization_id': 'S'})
os.environ['TABLE2_NAME'] = 'organizations'
os.environ['TABLE2_PK_NAME'] = 'organization_id'
os.environ['TABLE2_FIELD_TYPES'] = json.dumps({'organization_id': 'S', 'organization_name': 'S'})

import lambda_function as lambda_module


@pytest.fixture
def base_event():
    return {
        "headers": {"authorization": "Bearer dummy_token"},
        "body": json.dumps({
            "value": {
                "user_id": "user123"
            }
        })
    }

@patch('lambda_function.CognitoAuthenticator')
@patch('lambda_function.DynamoDBHandler')
def test_lambda_handler_success(mock_dynamodb_cls, mock_cognito_cls, base_event):
    # jwt_decodeがTrueを返すように
    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = True
    mock_cognito.get_claims.return_value = {}
    mock_cognito_cls.return_value = mock_cognito

    # DynamoDBHandlerのインスタンスモック
    mock_dynamodb1 = MagicMock()
    mock_dynamodb2 = MagicMock()
    # 1つめのDynamoDBHandlerのインスタンス生成時にmock_dynamodb1を返す
    # 2つめにmock_dynamodb2を返す
    mock_dynamodb_cls.side_effect = [mock_dynamodb1, mock_dynamodb2]

    # usersテーブルのquery_by_PKは該当ユーザーありを返す
    mock_dynamodb1.query_by_PK.return_value = [{'user_id': 'user123', 'organization_id': 'org456'}]

    # organizationsテーブルのquery_by_PKは該当組織ありを返す
    mock_dynamodb2.query_by_PK.return_value = [{'organization_id': 'org456', 'organization_name': 'Test Org'}]

    response = lambda_module.lambda_handler(base_event, None)

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['result'] == 'success'
    assert body['organization']['organization_id'] == 'org456'
    assert body['organization']['organization_name'] == 'Test Org'


@patch('lambda_function.CognitoAuthenticator')
@patch('lambda_function.DynamoDBHandler')
def test_lambda_handler_user_not_found(mock_dynamodb_cls, mock_cognito_cls, base_event):
    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = True
    mock_cognito.get_claims.return_value = {}
    mock_cognito_cls.return_value = mock_cognito

    mock_dynamodb1 = MagicMock()
    mock_dynamodb2 = MagicMock()
    mock_dynamodb_cls.side_effect = [mock_dynamodb1, mock_dynamodb2]

    # ユーザーが見つからない
    mock_dynamodb1.query_by_PK.return_value = []

    response = lambda_module.lambda_handler(base_event, None)

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['result'] == 'failure'
    assert body['message'] == 'Unregistered user'
    assert body['organization']['organization_id'] == ''
    assert body['organization']['organization_name'] == ''


@patch('lambda_function.CognitoAuthenticator')
@patch('lambda_function.DynamoDBHandler')
def test_lambda_handler_organization_not_found(mock_dynamodb_cls, mock_cognito_cls, base_event):
    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = True
    mock_cognito.get_claims.return_value = {}
    mock_cognito_cls.return_value = mock_cognito

    mock_dynamodb1 = MagicMock()
    mock_dynamodb2 = MagicMock()
    mock_dynamodb_cls.side_effect = [mock_dynamodb1, mock_dynamodb2]

    # ユーザーは見つかる
    mock_dynamodb1.query_by_PK.return_value = [{'user_id': 'user123', 'organization_id': 'org456'}]

    # 組織が見つからない
    mock_dynamodb2.query_by_PK.return_value = []

    # organization not found による ValueError で400応答を期待
    response = lambda_module.lambda_handler(base_event, None)
    assert response['statusCode'] == 400


import pytest
import json
import os
from unittest.mock import patch, MagicMock

# 先に環境変数をセットしておく
os.environ['REGION_NAME'] = 'ap-northeast-1'
os.environ['COGNITO_USER_POOL_ID'] = 'dummy_pool_id'
os.environ['COGNITO_APP_CLIENT_ID'] = 'dummy_app_client_id'
os.environ['TABLE1_NAME'] = 'users'
os.environ['TABLE1_PK_NAME'] = 'user_id'
os.environ['TABLE1_FIELD_TYPES'] = json.dumps({'user_id': 'S', 'organization_id': 'S', 'username': 'S'})
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
                "mode": "create",
                "organization_input": "Test Org",
                "user_id": "user123",
                "username": "user123name"
            }
        })
    }

@patch('lambda_function.boto3.client')
@patch('lambda_function.CognitoAuthenticator')
@patch('lambda_function.DynamoDBHandler')
def test_lambda_handler_create_success(mock_dynamodb_cls, mock_cognito_cls, mock_boto3_client, base_event):
    # CognitoAuthenticatorのjwt_decodeが成功
    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = True
    mock_cognito.get_claims.return_value = {}
    mock_cognito_cls.return_value = mock_cognito

    # DynamoDBHandlerのモックインスタンスを2つ返す（1つめはorganizations用、2つめはusers用）
    mock_dynamodb_org = MagicMock()
    mock_dynamodb_user = MagicMock()
    mock_dynamodb_cls.side_effect = [mock_dynamodb_org, mock_dynamodb_user]

    # organizationsテーブルのput_itemは成功（返り値リストに作成アイテムを模擬）
    mock_dynamodb_org.put_item.return_value = [{
        'organization_id': 'org123',
        'organization_name': 'Test Org'
    }]

    # usersテーブルのput_itemは成功
    mock_dynamodb_user.put_item.return_value = [{
        'user_id': 'user123',
        'organization_id': 'org123',
        'username': 'user123name'
    }]

    # boto3のcognito client admin_add_user_to_group呼び出しのモック
    mock_cognito_client = MagicMock()
    mock_boto3_client.return_value = mock_cognito_client

    response = lambda_module.lambda_handler(base_event, None)

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['result'] == 'success'
    assert body['user']['user_id'] == 'user123'
    assert body['user']['organization_name'] == 'Test Org'

    # admin_add_user_to_groupが正しく呼ばれたか確認
    mock_cognito_client.admin_add_user_to_group.assert_called_once_with(
        UserPoolId=os.environ['COGNITO_USER_POOL_ID'],
        Username='user123name',
        GroupName='admin'
    )

@patch('lambda_function.boto3.client')
@patch('lambda_function.CognitoAuthenticator')
@patch('lambda_function.DynamoDBHandler')
def test_lambda_handler_join_success(mock_dynamodb_cls, mock_cognito_cls, mock_boto3_client, base_event):
    # base_eventのmodeをjoinに書き換え
    event = base_event.copy()
    body = json.loads(event['body'])
    body['value']['mode'] = 'join'
    body['value']['organization_input'] = 'org123'
    event['body'] = json.dumps(body)

    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = True
    mock_cognito.get_claims.return_value = {}
    mock_cognito_cls.return_value = mock_cognito

    mock_dynamodb_org = MagicMock()
    mock_dynamodb_user = MagicMock()
    mock_dynamodb_cls.side_effect = [mock_dynamodb_org, mock_dynamodb_user]

    # organizationsテーブルのquery_by_PK成功
    mock_dynamodb_org.query_by_PK.return_value = [{
        'organization_id': 'org123',
        'organization_name': 'Joined Org'
    }]

    # usersテーブルのput_item成功
    mock_dynamodb_user.put_item.return_value = [{
        'user_id': 'user123',
        'organization_id': 'org123',
        'username': 'user123name'
    }]

    mock_cognito_client = MagicMock()
    mock_boto3_client.return_value = mock_cognito_client

    response = lambda_module.lambda_handler(event, None)

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['result'] == 'success'
    assert body['user']['organization_name'] == 'Joined Org'

    mock_cognito_client.admin_add_user_to_group.assert_called_once_with(
        UserPoolId=os.environ['COGNITO_USER_POOL_ID'],
        Username='user123name',
        GroupName='viewer'
    )

@patch('lambda_function.CognitoAuthenticator')
def test_lambda_handler_validation_error(mock_cognito_cls, base_event):
    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = True
    mock_cognito.get_claims.return_value = {}
    mock_cognito_cls.return_value = mock_cognito

    # リクエスト値からmode、organization_input、PK_NAME、usernameすべて外す
    event = base_event.copy()
    body = json.loads(event['body'])
    body['value'] = {}  # 空の辞書にする
    event['body'] = json.dumps(body)

    response = lambda_module.lambda_handler(event, None)
    assert response['statusCode'] == 400

@patch('lambda_function.CognitoAuthenticator')
def test_lambda_handler_unauthorized(mock_cognito_cls, base_event):
    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = False  # 認証失敗
    mock_cognito_cls.return_value = mock_cognito

    response = lambda_module.lambda_handler(base_event, None)
    assert response['statusCode'] == 401

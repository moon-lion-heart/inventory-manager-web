import pytest
import json
import os
from unittest.mock import patch, MagicMock


@pytest.fixture
def base_event():
    return {
        "body": json.dumps({
            "value": {
                "mode": "create",
                "organization_input": "Test Org",
                "user_id": "user123",
                "username": "tester"
            }
        }),
        "httpMethod": "POST",
        "headers": {"authorization": "Bearer dummy_token"}
    }

os.environ["REGION_NAME"] = "ap-northeast-1"
os.environ["COGNITO_USER_POOL_ID"] = "dummy_pool_id"
os.environ["COGNITO_APP_CLIENT_ID"] = "dummy_app_client_id"
os.environ["TABLE1_NAME"] = "users"
os.environ["TABLE1_PK_NAME"] = "user_id"
os.environ["TABLE1_FIELD_TYPES"] = '{"user_id":"S","organization_id":"S","username":"S"}'
os.environ["TABLE2_NAME"] = "organizations"
os.environ["TABLE2_PK_NAME"] = "organization_id"
os.environ["TABLE2_FIELD_TYPES"] = '{"organization_id":"S","organization_name":"S"}'


import lambda_function as lambda_module

@patch("lambda_function.CognitoAuthenticator.jwt_decode", return_value=True)
@patch("lambda_function.CognitoAuthenticator", autospec=True)
@patch("lambda_function.DynamoDBHandler")
@patch("lambda_function.boto3.client")
def test_options_request(mock_boto_client, mock_dynamodb_cls, mock_cognito_cls, mock_jwt_decode, base_event):
    event = base_event.copy()
    event["httpMethod"] = "OPTIONS"
    response = lambda_module.lambda_handler(event, None)
    assert response["statusCode"] == 204

@patch("lambda_function.boto3.client")
@patch("lambda_function.DynamoDBHandler")
@patch("lambda_function.CognitoAuthenticator")
def test_unauthorized(mock_cognito_cls, mock_dynamodb_cls, mock_boto_client, base_event):
    # CognitoAuthenticatorのインスタンスをモック化
    mock_cognito_instance = mock_cognito_cls.return_value
    # jwt_decodeメソッドの戻り値をFalseに設定
    mock_cognito_instance.jwt_decode.return_value = False

    response = lambda_module.lambda_handler(base_event, None)
    assert response["statusCode"] == 401

@patch("lambda_function.CognitoAuthenticator.jwt_decode", return_value=True)
@patch("lambda_function.CognitoAuthenticator", autospec=True)
@patch("lambda_function.DynamoDBHandler")
@patch("lambda_function.boto3.client")
def test_create_mode_success(mock_boto_client, mock_dynamodb_cls, mock_cognito_cls, mock_jwt_decode, base_event):
    # DynamoDBHandlerのインスタンスモック
    mock_dynamodb_instance1 = MagicMock()
    mock_dynamodb_instance2 = MagicMock()
    mock_dynamodb_cls.side_effect = [mock_dynamodb_instance1, mock_dynamodb_instance2]

    # put_item成功の戻り値をセット（リストに辞書を入れる想定）
    mock_dynamodb_instance2.put_item.return_value = [{"organization_id": "org123", "organization_name": "Test Org"}]
    mock_dynamodb_instance1.put_item.return_value = [{"user_id": "user123", "organization_id": "org123", "username": "tester"}]

    # boto3クライアントのモック（admin_add_user_to_group）
    mock_cognito_client = MagicMock()
    mock_boto_client.return_value = mock_cognito_client

    response = lambda_module.lambda_handler(base_event, None)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["result"] == "success"
    assert body["user"]["username"] == "tester"
    assert body["user"]["organization_name"] == "Test Org"
    # Cognitoのadmin_add_user_to_groupが呼ばれていることを確認
    mock_cognito_client.admin_add_user_to_group.assert_called_once_with(
        UserPoolId="dummy_pool_id",
        Username="tester",
        GroupName="admin"
    )

@patch("lambda_function.CognitoAuthenticator.jwt_decode", return_value=True)
@patch("lambda_function.CognitoAuthenticator", autospec=True)
@patch("lambda_function.DynamoDBHandler")
@patch("lambda_function.boto3.client")
def test_join_mode_success(mock_boto_client, mock_dynamodb_cls, mock_cognito_cls, mock_jwt_decode, base_event):
    event = base_event.copy()
    body = json.loads(event["body"])
    body["value"]["mode"] = "join"
    event["body"] = json.dumps(body)

    mock_dynamodb_instance1 = MagicMock()
    mock_dynamodb_instance2 = MagicMock()
    mock_dynamodb_cls.side_effect = [mock_dynamodb_instance1, mock_dynamodb_instance2]

    mock_dynamodb_instance2.query_by_PK.return_value = [{"organization_id": "org123", "organization_name": "Test Org"}]
    mock_dynamodb_instance1.put_item.return_value = [{"user_id": "user123", "organization_id": "org123", "username": "tester"}]

    mock_cognito_client = MagicMock()
    mock_boto_client.return_value = mock_cognito_client

    response = lambda_module.lambda_handler(event, None)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["result"] == "success"
    assert body["user"]["username"] == "tester"
    assert body["user"]["organization_name"] == "Test Org"
    mock_cognito_client.admin_add_user_to_group.assert_called_once_with(
        UserPoolId="dummy_pool_id",
        Username="tester",
        GroupName="viewer"
    )

@patch("lambda_function.CognitoAuthenticator.jwt_decode", return_value=True)
@patch("lambda_function.CognitoAuthenticator", autospec=True)
@patch("lambda_function.DynamoDBHandler")
@patch("lambda_function.boto3.client")
def test_missing_required_keys(mock_boto_client, mock_dynamodb_cls, mock_cognito_cls, mock_jwt_decode, base_event):
    event = base_event.copy()
    body = json.loads(event["body"])
    # 'username'キーを外す
    del body["value"]["username"]
    event["body"] = json.dumps(body)

    response = lambda_module.lambda_handler(event, None)

    assert response["statusCode"] == 400

@patch("lambda_function.CognitoAuthenticator.jwt_decode", return_value=True)
@patch("lambda_function.CognitoAuthenticator", autospec=True)
@patch("lambda_function.DynamoDBHandler")
@patch("lambda_function.boto3.client")
def test_organization_put_failure(mock_boto_client, mock_dynamodb_cls, mock_cognito_cls, mock_jwt_decode, base_event):
    mock_dynamodb_instance1 = MagicMock()
    mock_dynamodb_instance2 = MagicMock()
    mock_dynamodb_cls.side_effect = [mock_dynamodb_instance1, mock_dynamodb_instance2]

    # 組織登録失敗（空リスト返す）
    mock_dynamodb_instance2.put_item.return_value = []

    response = lambda_module.lambda_handler(base_event, None)

    assert response["statusCode"] == 400

@patch("lambda_function.CognitoAuthenticator.jwt_decode", return_value=True)
@patch("lambda_function.CognitoAuthenticator", autospec=True)
@patch("lambda_function.DynamoDBHandler")
@patch("lambda_function.boto3.client")
def test_organization_not_found(mock_boto_client, mock_dynamodb_cls, mock_cognito_cls, mock_jwt_decode, base_event):
    event = base_event.copy()
    body = json.loads(event["body"])
    body["value"]["mode"] = "join"
    event["body"] = json.dumps(body)

    mock_dynamodb_instance1 = MagicMock()
    mock_dynamodb_instance2 = MagicMock()
    mock_dynamodb_cls.side_effect = [mock_dynamodb_instance1, mock_dynamodb_instance2]

    # 組織取得失敗（空リスト返す）
    mock_dynamodb_instance2.query_by_PK.return_value = []

    response = lambda_module.lambda_handler(event, None)

    assert response["statusCode"] == 400

@patch("lambda_function.CognitoAuthenticator.jwt_decode", return_value=True)
@patch("lambda_function.CognitoAuthenticator", autospec=True)
@patch("lambda_function.DynamoDBHandler")
@patch("lambda_function.boto3.client")
def test_user_put_failure(mock_boto_client, mock_dynamodb_cls, mock_cognito_cls, mock_jwt_decode, base_event):
    mock_dynamodb_instance1 = MagicMock()
    mock_dynamodb_instance2 = MagicMock()
    mock_dynamodb_cls.side_effect = [mock_dynamodb_instance1, mock_dynamodb_instance2]

    mock_dynamodb_instance2.put_item.return_value = [{"organization_id": "org123", "organization_name": "Test Org"}]
    # ユーザー登録失敗（空リスト返す）
    mock_dynamodb_instance1.put_item.return_value = []

    response = lambda_module.lambda_handler(base_event, None)

    assert response["statusCode"] == 400

@patch("lambda_function.CognitoAuthenticator.jwt_decode", return_value=True)
@patch("lambda_function.CognitoAuthenticator", autospec=True)
@patch("lambda_function.DynamoDBHandler")
@patch("lambda_function.boto3.client")
def test_cognito_add_user_group_fail(mock_boto_client, mock_dynamodb_cls, mock_cognito_cls, mock_jwt_decode, base_event):
    mock_dynamodb_instance1 = MagicMock()
    mock_dynamodb_instance2 = MagicMock()
    mock_dynamodb_cls.side_effect = [mock_dynamodb_instance1, mock_dynamodb_instance2]

    mock_dynamodb_instance2.put_item.return_value = [{"organization_id": "org123", "organization_name": "Test Org"}]
    mock_dynamodb_instance1.put_item.return_value = [{"user_id": "user123", "organization_id": "org123", "username": "tester"}]

    mock_cognito_client = MagicMock()
    mock_cognito_client.admin_add_user_to_group.side_effect = Exception("Cognito error")
    mock_boto_client.return_value = mock_cognito_client

    response = lambda_module.lambda_handler(base_event, None)

    assert response["statusCode"] == 500

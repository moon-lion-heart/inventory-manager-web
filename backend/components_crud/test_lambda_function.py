import os
import json
import pytest
from unittest.mock import patch, MagicMock

os.environ['REGION_NAME'] = 'ap-northeast-1'
os.environ['COGNITO_USER_POOL_ID'] = 'dummy_pool_id'
os.environ['COGNITO_APP_CLIENT_ID'] = 'dummy_app_client_id'
os.environ['TABLE_NAME'] = 'test_table'
os.environ['PK_NAME'] = 'pk'
os.environ['SK_NAME'] = 'sk'
os.environ['SK_PREFIX'] = 'pk'
os.environ['SK_SUFFIX'] = 'id'
os.environ['SK_DELIMITER'] = '#'
os.environ['FIELD_TYPES'] = json.dumps({'pk': 'S', 'sk': 'S', 'name': 'S', 'id': 'S'})

from lambda_function import lambda_handler, STATUS_CODE_UNAUTHORIZED


@pytest.fixture
def base_event():
    return {
        'headers': {'authorization': 'Bearer dummy_token'},
        'body': json.dumps({'action': 'query', 'value': {'pk': 'user1'}})
    }


@patch('lambda_function.CognitoAuthenticator')
@patch('lambda_function.DynamoDBHandler')
def test_lambda_handler_query_success(mock_dynamodb_cls, mock_cognito_cls, base_event):
    # CognitoAuthenticator のモック
    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = True
    mock_cognito.get_claims.return_value = {'cognito:groups': ['admin']}
    mock_cognito_cls.return_value = mock_cognito

    # DynamoDBHandler のモック
    mock_dynamodb = MagicMock()
    mock_dynamodb.query_by_PK.return_value = [{'pk': 'user1', 'name': 'test'}]
    mock_dynamodb_cls.return_value = mock_dynamodb

    response = lambda_handler(base_event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    assert body['result'] == 'success'
    assert isinstance(body['components'], list)
    assert body['components'][0]['pk'] == 'user1'


@patch('lambda_function.CognitoAuthenticator')
def test_lambda_handler_unauthorized(mock_cognito_cls, base_event):
    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = False
    mock_cognito_cls.return_value = mock_cognito

    response = lambda_handler(base_event, None)
    assert response['statusCode'] == STATUS_CODE_UNAUTHORIZED


def test_lambda_handler_options_request():
    event = {'httpMethod': 'OPTIONS'}
    response = lambda_handler(event, None)
    assert response['statusCode'] == 204


@patch('lambda_function.CognitoAuthenticator')
@patch('lambda_function.DynamoDBHandler')
def test_lambda_handler_put_success(mock_dynamodb_cls, mock_cognito_cls, base_event):
    event = base_event.copy()
    event['body'] = json.dumps({'action': 'put', 'value': {'pk': 'user1', 'name': 'test'}})

    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = True
    mock_cognito.get_claims.return_value = {'cognito:groups': ['editor']}
    mock_cognito_cls.return_value = mock_cognito

    mock_dynamodb = MagicMock()
    mock_dynamodb.put_item.return_value = [{'pk': 'user1', 'name': 'test'}]
    mock_dynamodb_cls.return_value = mock_dynamodb

    response = lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    assert body['result'] == 'success'
    assert body['components'][0]['pk'] == 'user1'


@patch('lambda_function.CognitoAuthenticator')
@patch('lambda_function.DynamoDBHandler')
def test_lambda_handler_update_no_permission(mock_dynamodb_cls, mock_cognito_cls, base_event):
    event = base_event.copy()
    event['body'] = json.dumps({'action': 'update', 'value': {'pk': 'user1', 'name': 'test'}})

    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = True
    mock_cognito.get_claims.return_value = {'cognito:groups': ['viewer']}  # 編集権限なし
    mock_cognito_cls.return_value = mock_cognito

    response = lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    assert body['result'] == 'failure'
    assert body['message'] == '編集権限がありません'


@patch('lambda_function.CognitoAuthenticator')
@patch('lambda_function.DynamoDBHandler')
def test_lambda_handler_delete_success(mock_dynamodb_cls, mock_cognito_cls, base_event):
    event = base_event.copy()
    event['body'] = json.dumps({'action': 'delete', 'value': [{'pk': 'user1', 'sk': 'pk#id'}]})

    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = True
    mock_cognito.get_claims.return_value = {'cognito:groups': ['admin']}
    mock_cognito_cls.return_value = mock_cognito

    mock_dynamodb = MagicMock()
    mock_dynamodb.batch_delete_items.return_value = True
    mock_dynamodb_cls.return_value = mock_dynamodb

    response = lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    assert body['result'] == 'success'


@patch('lambda_function.CognitoAuthenticator')
@patch('lambda_function.DynamoDBHandler')
def test_lambda_handler_unknown_action(mock_dynamodb_cls, mock_cognito_cls, base_event):
    event = base_event.copy()
    event['body'] = json.dumps({'action': 'unknown_action', 'value': {}})

    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = True
    mock_cognito.get_claims.return_value = {'cognito:groups': ['admin']}
    mock_cognito_cls.return_value = mock_cognito

    response = lambda_handler(event, None)
    body = json.loads(response['body'])

    assert response['statusCode'] == 200
    assert body['result'] == 'failure'
    assert body['components'] == []


@patch('lambda_function.CognitoAuthenticator')
@patch('lambda_function.DynamoDBHandler')
def test_lambda_handler_bad_request(mock_dynamodb_cls, mock_cognito_cls, base_event):
    event = base_event.copy()
    event['body'] = "invalid json"

    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = True
    mock_cognito_cls.return_value = mock_cognito

    response = lambda_handler(event, None)
    assert response['statusCode'] == 400


@patch('lambda_function.CognitoAuthenticator')
@patch('lambda_function.DynamoDBHandler')
def test_lambda_handler_internal_error(mock_dynamodb_cls, mock_cognito_cls, base_event):
    event = base_event.copy()
    event['body'] = json.dumps({'action': 'put', 'value': {'pk': 'user1', 'name': 'test'}})

    mock_cognito = MagicMock()
    mock_cognito.jwt_decode.return_value = True
    mock_cognito.get_claims.return_value = {'cognito:groups': ['admin']}
    mock_cognito_cls.return_value = mock_cognito

    mock_dynamodb = MagicMock()
    mock_dynamodb.put_item.side_effect = Exception('Some internal error')
    mock_dynamodb_cls.return_value = mock_dynamodb

    response = lambda_handler(event, None)
    assert response['statusCode'] == 500

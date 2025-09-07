import pytest
from jose import jwt
from unittest.mock import patch
from cognito_auth import CognitoAuthenticator

class DummyJWTError(Exception):
    pass

@pytest.fixture
def sample_event():
    return {
        'headers': {
            'authorization': 'Bearer dummy_token'
        }
    }

@patch('cognito_auth.CognitoAuthenticator.get_cognito_jwks')
@patch('cognito_auth.jwt.decode')
def test_jwt_decode_success(mock_jwt_decode, mock_get_jwks, sample_event):
    mock_get_jwks.return_value = {'keys': []}
    mock_jwt_decode.return_value = {'sub': '1234567890', 'aud': 'test_app'}

    auth = CognitoAuthenticator('ap-northeast-1', 'userpool123', 'test_app')
    result = auth.jwt_decode(sample_event)

    assert result is True
    assert auth.get_claims() == {'sub': '1234567890', 'aud': 'test_app'}
    mock_get_jwks.assert_called_once()
    mock_jwt_decode.assert_called_once()

@patch('cognito_auth.CognitoAuthenticator.get_cognito_jwks')
@patch('cognito_auth.jwt.decode')
def test_jwt_decode_expired_signature(mock_jwt_decode, mock_get_jwks, sample_event):
    mock_get_jwks.return_value = {'keys': []}
    mock_jwt_decode.side_effect = jwt.ExpiredSignatureError

    auth = CognitoAuthenticator('ap-northeast-1', 'userpool123', 'test_app')
    result = auth.jwt_decode(sample_event)

    assert result is False
    assert auth.get_claims() is None


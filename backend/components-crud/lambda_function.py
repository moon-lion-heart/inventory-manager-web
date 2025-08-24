from dynamodb_handler import DynamoDBHandler
from cognito_auth import CognitoAuthenticator, STATUS_CODE_UNAUTHORIZED
import json
import os
import logging
from decimal import Decimal

REGION_NAME = os.environ['REGION_NAME']
COGNITO_USER_POOL_ID = os.environ['COGNITO_USER_POOL_ID']
COGNITO_APP_CLIENT_ID = os.environ['COGNITO_APP_CLIENT_ID']
TABLE_NAME = os.environ['TABLE_NAME']
PK_NAME = os.environ['PK_NAME']
SK_NAME = os.environ['SK_NAME']
SK_PREFIX = os.environ['SK_PREFIX']
SK_SUFFIX = os.environ['SK_SUFFIX']
SK_DELIMITER = os.environ['SK_DELIMITER']
FIELD_TYPES = json.loads(os.environ['FIELD_TYPES'])

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class StringDecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super().default(obj)


def lambda_handler(event, context):
    logger.info('Lambda function invoked from Lambda Function URLs.')

    logger.info(f'Received raw event: {json.dumps(event, indent=2)}')
    if ('httpMethod' in event) and (event['httpMethod'] == 'OPTIONS'):
        logger.info('OPTIONS request received for CORS preflight check.')
        return {
            'statusCode': 204,
        }

    cognitoAuthenticator = CognitoAuthenticator(REGION_NAME, COGNITO_USER_POOL_ID, COGNITO_APP_CLIENT_ID)
    is_decode_success = cognitoAuthenticator.jwt_decode(event)
    if not is_decode_success:
        return {
            'statusCode': STATUS_CODE_UNAUTHORIZED,
        }
    

    try:
        request_body = json.loads(event['body'])
        action_type = request_body['action']
        value = request_body['value']
        result = False
        message = ''
        response_value = [] # 辞書のリスト

        claims = cognitoAuthenticator.get_claims()
        groups = claims.get('cognito:groups', [])
        logger.info(f'User groups: {groups}')

        allowed_groups = ['editor', 'admin']
        is_editable = True
        if not any(g in groups for g in allowed_groups):
            is_editable = False

        if action_type in ['put', 'update', 'delete']:
            if not is_editable:
                message = '編集権限がありません'

        if message == '':
            dynamodb_handler = DynamoDBHandler(
                REGION_NAME, TABLE_NAME, PK_NAME, SK_NAME, SK_PREFIX, SK_SUFFIX, SK_DELIMITER, FIELD_TYPES
            )

            if action_type == 'query':
                if 'category' in value:
                    response_value = dynamodb_handler.query_by_sk_prefix(value)
                else:
                    response_value = dynamodb_handler.query_by_PK(value)
                result = True
            elif action_type == 'put':
                response_value = dynamodb_handler.put_item(value)
                if len(response_value) > 0:
                    result = True
            elif action_type == 'update':
                result = dynamodb_handler.update_item(value)
            elif action_type == 'delete':
                result = dynamodb_handler.batch_delete_items(value)
            else:
                logger.info(f'Not support action: {action_type}')


        response_body = {
            'result': 'success' if result else 'failure',
            'message': message,
            'components': response_value
        }
        dumped_body = json.dumps(response_body, cls=StringDecimalEncoder)
        logger.info(f'Returning response: {dumped_body}')
        
        return {
            'statusCode': 200,
            'body': dumped_body
        }

    except ValueError as ve:
        logger.error(ve)
        return {
            'statusCode': 400, # Bad Request
        }
    except Exception as e:
        logger.error(f'Error processing request: {e}', exc_info=True)
        return {
            'statusCode': 500, # Internal Server Error
        }
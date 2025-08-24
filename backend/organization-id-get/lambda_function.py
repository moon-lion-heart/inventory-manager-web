from dynamodb_handler import DynamoDBHandler
from cognito_auth import CognitoAuthenticator, STATUS_CODE_UNAUTHORIZED
import json
import os
import logging
from decimal import Decimal

REGION_NAME = os.environ['REGION_NAME']
COGNITO_USER_POOL_ID = os.environ['COGNITO_USER_POOL_ID']
COGNITO_APP_CLIENT_ID = os.environ['COGNITO_APP_CLIENT_ID']
TABLE1_NAME = os.environ['TABLE1_NAME']
TABLE1_PK_NAME = os.environ['TABLE1_PK_NAME']
TABLE1_FIELD_TYPES = json.loads(os.environ['TABLE1_FIELD_TYPES'])
TABLE2_NAME = os.environ['TABLE2_NAME']
TABLE2_PK_NAME = os.environ['TABLE2_PK_NAME']
TABLE2_FIELD_TYPES = json.loads(os.environ['TABLE2_FIELD_TYPES'])

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
        value = request_body['value']

        dynamodb_handler1 = DynamoDBHandler(REGION_NAME, TABLE1_NAME, TABLE1_PK_NAME, '', '', '', '', TABLE1_FIELD_TYPES)
        dynamodb_handler2 = DynamoDBHandler(REGION_NAME, TABLE2_NAME, TABLE2_PK_NAME, '', '', '', '', TABLE2_FIELD_TYPES)

        response_item = []
        # usersテーブルからuser_idが一致するレコードを取得する
        if value[TABLE1_PK_NAME] != '':
            item = dynamodb_handler1.query_by_PK(value)
            if len(item) == 0:
                logger.info(f'User not found: {value}')
            else:
                # organizationsテーブルからorganization_idが一致するレコードを取得する
                response_item = dynamodb_handler2.query_by_PK(item[0])
                if len(response_item) == 0:
                    raise ValueError(f'organization not found: {value}')

        if len(response_item) == 0:
            response_body = {
                'result': 'failure',
                'message': 'Unregistered user',
                'organization': {
                    'organization_id': '',
                    'organization_name': ''
                }
            }
        else:
            response_body = {
                'result': 'success',
                'message': '',
                'organization': response_item[0]
            }

        logger.info(f'Returning response: {json.dumps(response_body, cls=StringDecimalEncoder)}')
        
        return {
            'statusCode': 200,
            'body': json.dumps(response_body, cls=StringDecimalEncoder)
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
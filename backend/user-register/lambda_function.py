from dynamodb_handler import DynamoDBHandler
from cognito_auth import CognitoAuthenticator, STATUS_CODE_UNAUTHORIZED
import json
import os
import logging
from decimal import Decimal
import uuid
import boto3

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
        # リクエストvalidation
        if 'mode' not in value and 'organization_input' not in value and TABLE1_PK_NAME not in value and 'username' not in value:
            raise ValueError(f'Invalid request: {value}')

        dynamodb_handler1 = DynamoDBHandler(REGION_NAME, TABLE1_NAME, TABLE1_PK_NAME, '', '', '', '', TABLE1_FIELD_TYPES)
        dynamodb_handler2 = DynamoDBHandler(REGION_NAME, TABLE2_NAME, TABLE2_PK_NAME, '', '', '', '', TABLE2_FIELD_TYPES)
        
        if value['mode'] == 'create':
            item = {
                TABLE2_PK_NAME: str(uuid.uuid4()),
                'organization_name': value['organization_input'],
            }
            organization_response_item = dynamodb_handler2.put_item(item)
            if len(organization_response_item) == 0:
                raise ValueError(f"Organization put error: {value['organization_input']}")
            
        elif value['mode'] == 'join':
            item = {
                TABLE2_PK_NAME: value['organization_input']
            }
            organization_response_item = dynamodb_handler2.query_by_PK(item)
            if len(organization_response_item) == 0:
                raise ValueError(f"Organization not found: {value['organization_input']}")
        
        logger.info(f'organization_response_item: {organization_response_item}')
        
        item = {
            TABLE1_PK_NAME: value[TABLE1_PK_NAME],
            TABLE2_PK_NAME: organization_response_item[0][TABLE2_PK_NAME],
            'username': value['username'],
        }
        user_response_item = dynamodb_handler1.put_item(item)
        if len(user_response_item) == 0:
            raise ValueError(f'User put error: {value}')

        response_item = {
            TABLE1_PK_NAME: user_response_item[0][TABLE1_PK_NAME],
            TABLE2_PK_NAME: organization_response_item[0][TABLE2_PK_NAME],
            'organization_name': organization_response_item[0]['organization_name'],
            'username': user_response_item[0]['username'],
        }
        
        response_body = {
            'result': 'success',
            'message': '',
            'user': response_item
        }
        dumped_response_body = json.dumps(response_body, cls=StringDecimalEncoder)
        logger.info(f'Returning response: {dumped_response_body}')

        # cognito userをcognito groupに追加
        groupName = 'admin' if value['mode'] == 'create' else 'viewer'
        cognito_client = boto3.client("cognito-idp")
        cognito_client.admin_add_user_to_group(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=value['username'],
            GroupName=groupName
        )
        logger.info(f'Added user to group: username={value["username"]}, group={groupName}')
        
        return {
            'statusCode': 200,
            'body': dumped_response_body
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
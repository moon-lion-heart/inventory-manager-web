import boto3
from boto3.dynamodb.types import TypeDeserializer
import datetime
import uuid
import logging
import json
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)


class DynamoDBHandler:
    def __init__(self, region_name, table_name, pk_name, sk_name, sk_prefix, sk_suffix, sk_delimiter, field_types, is_local=False):
        self.region_name = region_name
        self.table_name = table_name
        self.pk_name = pk_name
        self.sk_name = sk_name
        self.sk_prefix = sk_prefix
        self.sk_suffix = sk_suffix
        self.sk_delimiter = sk_delimiter
        self.field_types = field_types
        self.is_local = is_local
        if is_local:
            self.dynamodb = boto3.client('dynamodb', endpoint_url='http://localhost:8000', region_name=self.region_name)
        else:
            self.dynamodb = boto3.client('dynamodb', region_name=self.region_name)


    def create_sk_value(self, pk_prefix, pk_suffix):
        return f'{pk_prefix}{self.sk_delimiter}{pk_suffix}'


    def parse_sk_value(self, sk_value):
        parts = sk_value.split(self.sk_delimiter, 1)
        if len(parts) == 2:
            return parts[0], parts[1]
        else:
            raise ValueError(f'Invalid SK value: {sk_value}')


    def get_current_timestamp(self):
        jst_tz = ZoneInfo('Asia/Tokyo')
        now_jst = datetime.datetime.now(jst_tz)
        return now_jst.strftime('%Y/%m/%d %H:%M:%S')

    
    def put_item(self, request_item):
        try:
            timestamp = self.get_current_timestamp()
            request_item['created_at'] = timestamp
            request_item['updated_at'] = timestamp

            item = {
                'created_at': {'S': timestamp},
                'updated_at': {'S': timestamp},
            }
            if self.sk_name != '':
                if self.sk_delimiter != '':
                    item_id = str(uuid.uuid4())
                    sk_value = self.create_sk_value(request_item[self.sk_prefix], item_id)
                    item[self.sk_name] = {'S': sk_value}
                    item[self.sk_suffix] = {'S': item_id}
                    request_item[self.sk_name] = sk_value
                    request_item[self.sk_suffix] = item_id
                else:
                    item[self.sk_name] = {self.field_types[self.sk_name]: request_item[self.sk_name]}            

            for key, value in self.field_types.items():
                if key in request_item:
                    item[key] = {value: request_item[key]}
        except KeyError as e:
            raise KeyError(f'KeyError in put_item: {e}')

        try:
            logger.info(f'putting item: {item}')
            self.dynamodb.put_item(TableName=self.table_name, Item=item)
            logger.info('Successfully put item')
            return [request_item]
        except Exception as e:
            raise Exception(f'Failed to put item: {e}')


    
    def update_item(self, item):
        try:
            pk_val = item.pop(self.pk_name)
            if self.sk_name != '':
                sk_val = item.pop(self.sk_name)
        except KeyError:
            raise KeyError(f'KeyError in update_item: pk:{self.pk_name}, sk:{self.sk_name}')

        timestamp = self.get_current_timestamp()

        update_expression_parts = []
        expression_attribute_values = {}
        expression_attribute_names = {}
        
        update_expression_parts.append(f'#ua = :updated_at_val')
        expression_attribute_names['#ua'] = 'updated_at'
        expression_attribute_values[':updated_at_val'] = {'S': timestamp}

        for key, value in item.items():
            placeholder_name = f'#{key}'
            placeholder_value = f':{key}_val'
            
            update_expression_parts.append(f'{placeholder_name} = {placeholder_value}')
            expression_attribute_names[placeholder_name] = key
            expression_attribute_values[placeholder_value] = {self.field_types[key]: value}

        update_expression = 'SET ' + ', '.join(update_expression_parts)

        logger.info('Updating item...')
        key_item = {
            self.pk_name: {'S': pk_val}
        }
        if self.sk_name != '':
            key_item[self.sk_name] = {'S': sk_val}

        try:
            response = self.dynamodb.update_item(
                TableName=self.table_name,
                Key=key_item,
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues='UPDATED_NEW' # 更新後の新しい属性値を返す
            )
            logger.info('Successfully update item. Updated attributes:', response['Attributes'])
            return True
        except Exception as e:
            raise Exception(f'Failed to update item: {e}')


    
    # TODO: batchが失敗したらロールバックしないとでは？
    # request: json
    # request: [{
    #     PK_NAME: pk_val,
    #     SK_NAME: sk_val
    # }, ...]
    def batch_delete_items(self, item):
        try:
            if isinstance(item, str):
                item = json.loads(item)
        except json.JSONDecodeError:
            item = [item]
        

        logger.info('Deleting items...')
        # 25件ずつに分割（DynamoDBの制限）
        for i in range(0, len(item), 25):
            batch = item[i:i + 25]
            request_items = {self.table_name: []}
            have_sk = False
            if self.sk_name != '':
                have_sk = True
                
            for primary_item in batch:
                delete_request_item = {}
                delete_request_item['DeleteRequest'] = {'Key': {
                    self.pk_name: {'S': primary_item[self.pk_name]}
                }}
                if have_sk:
                    if self.sk_delimiter != '':
                        delete_request_item['DeleteRequest']['Key'][self.sk_name] = {'S': primary_item[self.sk_name]}
                    else:
                        delete_request_item['DeleteRequest']['Key'][self.sk_name] = {self.field_types[self.sk_name]: primary_item[self.sk_name]}
                
                request_items[self.table_name].append(delete_request_item)

            try:
                logger.info(f'request_items: {request_items}')
                response = self.dynamodb.batch_write_item(RequestItems=request_items)
            
                if response.get('UnprocessedItems'):
                    logger.error(f"Unprocessed items: {response['UnprocessedItems']}")
                    return False
                
            except Exception as e:
                logger.error(f'Failed to delete item: {e}')
                return False

        logger.info('Successfully delete items')
        return True
        


    # PK+SK_PREFIXに一致するすべてのアイテムを取得
    def query_by_sk_prefix(self, item):
        try:
            pk_val = item[self.pk_name]
            sk_prefix_val = item[self.sk_prefix]
        except KeyError:
            raise KeyError(f'KeyError in query_by_sk_prefix: pk:{self.pk_name}, sk_prefix:{self.sk_prefix}')

        logger.info(f'Querying ({self.pk_name}: {pk_val}, {self.sk_prefix}: {sk_prefix_val})...')

        sk_prefix = f'{sk_prefix_val}{self.sk_delimiter}'
        query_params = {
            'TableName': self.table_name,
            'KeyConditionExpression': f'#pk = :pk_val AND begins_with(#sk, :sk_prefix_val)',
            'ExpressionAttributeNames': {
                '#pk': self.pk_name,
                '#sk': self.sk_name
            },
            'ExpressionAttributeValues': {
                ':pk_val': {'S': pk_val},
                ':sk_prefix_val': {'S': sk_prefix}
            }
        }

        return self.query_with_pagination(query_params)


    # PKが一致するすべてのアイテムを取得
    def query_by_PK(self, item):
        try:
            pk_val = item[self.pk_name]
        except KeyError:
            raise KeyError(f'KeyError in query_by_PK: {self.pk_name}')

        logger.info(f'Querying ({self.pk_name}: {pk_val})...')

        query_params = {
            'TableName': self.table_name,
            'KeyConditionExpression': '#pk = :pk_val',
            'ExpressionAttributeNames': {
                '#pk': self.pk_name
            },
            'ExpressionAttributeValues': {
                ':pk_val': {'S': pk_val}
            }
        }

        return self.query_with_pagination(query_params)


    def query_with_pagination(self, query_params):
        logger.info(f'Query Parameters: {query_params}')

        all_items = []
        last_evaluated_key = None
        deserializer = TypeDeserializer()
        
        while True:
            try:
                if last_evaluated_key:
                    query_params['ExclusiveStartKey'] = last_evaluated_key
                    logger.info(f'  > Requesting next page with ExclusiveStartKey...')

                response = self.dynamodb.query(**query_params)
                current_items = response.get('Items', [])
                logger.info(f'  > Current page query records: {len(current_items)}')
                
                for item in current_items:
                    plain_item = {k: deserializer.deserialize(v) for k, v in item.items()}
                    all_items.append(plain_item)
                
                last_evaluated_key = response.get('LastEvaluatedKey')
                if not last_evaluated_key:
                    break
                
            except Exception as e:
                logger.error(f'Failed to query. param: {query_params}')
                raise Exception(e)

        logger.info(f'query records:{len(all_items)}')
        logger.info(f'query result:{all_items}')
        return all_items
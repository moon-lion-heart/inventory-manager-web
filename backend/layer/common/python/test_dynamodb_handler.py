import pytest
from unittest.mock import patch, MagicMock
from dynamodb_handler import DynamoDBHandler

@pytest.fixture
def handler():
    return DynamoDBHandler(
        region_name='ap-northeast-1',
        table_name='test_table',
        pk_name='pk',
        sk_name='sk',
        sk_prefix='pk',
        sk_suffix='id',
        sk_delimiter='#',
        field_types={'pk': 'S', 'sk': 'S', 'name': 'S', 'id': 'S'},
        is_local=True
    )

@patch('dynamodb_handler.boto3.client')
def test_put_item_success(mock_boto_client, handler):
    mock_dynamodb = MagicMock()
    mock_boto_client.return_value = mock_dynamodb

    request_item = {
        'pk': 'user1',
        'name': 'test item',
        'pk': 'user1'
    }

    mock_dynamodb.put_item.return_value = {}

    result = handler.put_item(request_item)
    assert isinstance(result, list)
    assert 'created_at' in request_item
    mock_dynamodb.put_item.assert_called_once()

@patch('dynamodb_handler.boto3.client')
def test_update_item_success(mock_boto_client, handler):
    mock_dynamodb = MagicMock()
    mock_boto_client.return_value = mock_dynamodb

    item = {
        'pk': 'user1',
        'sk': 'user1#1234',
        'name': 'updated name'
    }

    mock_dynamodb.update_item.return_value = {
        'Attributes': {'name': {'S': 'updated name'}}
    }

    result = handler.update_item(item)
    assert result is True
    mock_dynamodb.update_item.assert_called_once()

@patch('dynamodb_handler.boto3.client')
def test_batch_delete_items_success(mock_boto_client, handler):
    mock_dynamodb = MagicMock()
    mock_boto_client.return_value = mock_dynamodb
    mock_dynamodb.batch_write_item.return_value = {}

    items = [
        {'pk': 'user1', 'sk': 'user1#1'},
        {'pk': 'user2', 'sk': 'user2#2'}
    ]

    result = handler.batch_delete_items(items)
    assert result is True
    mock_dynamodb.batch_write_item.assert_called()

@patch('dynamodb_handler.boto3.client')
def test_query_with_pagination_success(mock_boto_client, handler):
    mock_dynamodb = MagicMock()
    mock_boto_client.return_value = mock_dynamodb

    mock_dynamodb.query.side_effect = [
        {'Items': [
            {'pk': {'S': 'user1'}, 'sk': {'S': 'user1#1'}, 'name': {'S': 'item1'}}
        ], 'LastEvaluatedKey': {'pk': {'S': 'user1'}, 'sk': {'S': 'user1#1'}}},
        {'Items': [
            {'pk': {'S': 'user1'}, 'sk': {'S': 'user1#2'}, 'name': {'S': 'item2'}}
        ]}
    ]

    query_params = {
        'TableName': 'test_table',
        'KeyConditionExpression': '#pk = :pk_val',
        'ExpressionAttributeNames': {'#pk': 'pk'},
        'ExpressionAttributeValues': {':pk_val': {'S': 'user1'}}
    }

    items = handler.query_with_pagination(query_params)
    assert len(items) == 2
    assert items[0]['name'] == 'item1'
    assert items[1]['name'] == 'item2'
    assert mock_dynamodb.query.call_count == 2

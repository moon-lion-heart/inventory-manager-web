import pytest
import json
from unittest.mock import MagicMock
from dynamodb_handler import DynamoDBHandler  # 適宜インポート先を修正


@pytest.fixture
def base_handler():
    return DynamoDBHandler(
        region_name='ap-northeast-1',
        table_name='test_table',
        pk_name='pk',
        sk_name='sk',
        sk_prefix='pk',
        sk_suffix='id',
        sk_delimiter='#',
        field_types={'pk': 'S', 'sk': 'S', 'id': 'S', 'name': 'S'},
        is_local=True
    )

def test_put_item_success_with_sk(monkeypatch, base_handler):
    # DynamoDBクライアントのput_itemをモック
    mock_put_item = MagicMock()
    monkeypatch.setattr(base_handler.dynamodb, "put_item", mock_put_item)

    request_item = {
        'pk': 'user1',
        'name': 'Test User'
    }

    result = base_handler.put_item(request_item)

    # put_itemが呼ばれているか
    mock_put_item.assert_called_once()
    # 結果がlistで、1件目のpkが正しいか
    assert isinstance(result, list)
    assert result[0]['pk'] == 'user1'
    # skとidは生成されているはず
    assert 'sk' in result[0]
    assert 'id' in result[0]
    # skは sk_prefix + sk_delimiter + id でできているか
    sk_value = result[0]['sk']
    assert sk_value.startswith('user1#')
    # idはUUID形式っぽいか（簡易チェック）
    import re
    uuid_regex = re.compile(r'^[0-9a-f\-]{36}$')
    assert uuid_regex.match(result[0]['id'])

def test_put_item_success_without_sk(monkeypatch):
    # sk_name空文字でテスト
    handler = DynamoDBHandler(
        region_name='ap-northeast-1',
        table_name='test_table',
        pk_name='pk',
        sk_name='',
        sk_prefix='',
        sk_suffix='',
        sk_delimiter='',
        field_types={'pk': 'S', 'name': 'S'},
        is_local=True
    )
    mock_put_item = MagicMock()
    monkeypatch.setattr(handler.dynamodb, "put_item", mock_put_item)

    request_item = {
        'pk': 'user1',
        'name': 'Test User'
    }

    result = handler.put_item(request_item)
    mock_put_item.assert_called_once()
    assert isinstance(result, list)
    assert result[0]['pk'] == 'user1'
    # skはない
    assert 'sk' not in result[0]

def test_put_item_keyerror(monkeypatch, base_handler):
    # sk_prefixがrequest_itemにないのでKeyErrorになる
    mock_put_item = MagicMock()
    monkeypatch.setattr(base_handler.dynamodb, "put_item", mock_put_item)

    request_item = {
        # 'pk'がsk_prefixなのでこれがないとKeyErrorになる
        'name': 'Test User'
    }

    with pytest.raises(KeyError) as excinfo:
        base_handler.put_item(request_item)
    assert "KeyError" in str(excinfo.value)

def test_put_item_dynamodb_exception(monkeypatch, base_handler):
    def raise_exception(*args, **kwargs):
        raise Exception("DynamoDB put failed")

    monkeypatch.setattr(base_handler.dynamodb, "put_item", raise_exception)

    request_item = {
        'pk': 'user1',
        'name': 'Test User'
    }

    with pytest.raises(Exception) as excinfo:
        base_handler.put_item(request_item)
    assert "Failed to put item" in str(excinfo.value)

@pytest.fixture
def handler_with_sk():
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

@pytest.fixture
def handler_without_sk():
    return DynamoDBHandler(
        region_name='ap-northeast-1',
        table_name='test_table',
        pk_name='pk',
        sk_name='',
        sk_prefix='',
        sk_suffix='',
        sk_delimiter='',
        field_types={'pk': 'S', 'name': 'S', 'id': 'S'},
        is_local=True
    )


def test_update_item_success_with_sk(handler_with_sk, monkeypatch):
    monkeypatch.setattr(handler_with_sk, "get_current_timestamp", lambda: "2025/08/12 12:00:00")
    mock_update_item = MagicMock(return_value={'Attributes': {'name': {'S': 'test'}}})
    handler_with_sk.dynamodb.update_item = mock_update_item

    item = {'pk': 'key1', 'sk': 'sk#id1', 'name': 'test'}

    result = handler_with_sk.update_item(item.copy())
    assert result is True
    mock_update_item.assert_called_once()
    args, kwargs = mock_update_item.call_args
    assert kwargs['TableName'] == 'test_table'
    assert '#ua' in kwargs['ExpressionAttributeNames']
    assert ':updated_at_val' in kwargs['ExpressionAttributeValues']


def test_update_item_success_without_sk(handler_without_sk, monkeypatch):
    monkeypatch.setattr(handler_without_sk, "get_current_timestamp", lambda: "2025/08/12 12:00:00")
    mock_update_item = MagicMock(return_value={'Attributes': {'name': {'S': 'test'}}})
    handler_without_sk.dynamodb.update_item = mock_update_item

    item = {'pk': 'key1', 'name': 'test'}

    result = handler_without_sk.update_item(item.copy())
    assert result is True
    mock_update_item.assert_called_once()


def test_update_item_key_error_missing_pk(handler_with_sk):
    item = {'sk': 'sk#id1', 'name': 'test'}
    with pytest.raises(KeyError, match='KeyError in update_item'):
        handler_with_sk.update_item(item)


def test_update_item_key_error_missing_sk(handler_with_sk):
    item = {'pk': 'key1', 'name': 'test'}
    with pytest.raises(KeyError, match='KeyError in update_item'):
        handler_with_sk.update_item(item)


def test_update_item_dynamodb_exception(handler_with_sk, monkeypatch):
    monkeypatch.setattr(handler_with_sk, "get_current_timestamp", lambda: "2025/08/12 12:00:00")
    def raise_exception(*args, **kwargs):
        raise Exception("DynamoDB update failed")

    handler_with_sk.dynamodb.update_item = raise_exception

    item = {'pk': 'key1', 'sk': 'sk#id1', 'name': 'test'}

    with pytest.raises(Exception, match='Failed to update item: DynamoDB update failed'):
        handler_with_sk.update_item(item)


@pytest.fixture
def mock_handler():
    handler = DynamoDBHandler(
        region_name="ap-northeast-1",
        table_name="TestTable",
        pk_name="pk",
        sk_name="",
        sk_prefix="",
        sk_suffix="",
        sk_delimiter="",
        field_types={"pk": "S", "sk": "S"},
        is_local=False
    )
    handler.dynamodb = MagicMock()
    return handler


# ===== 正常系 =====

def test_normal_delete_sk_with_delimiter(mock_handler):
    mock_handler.sk_name = "sk"
    mock_handler.sk_delimiter = "-"
    mock_handler.dynamodb.batch_write_item.return_value = {}
    items = [{"pk": "1", "sk": "1-1"}]
    result = mock_handler.batch_delete_items(items)
    assert result is True
    mock_handler.dynamodb.batch_write_item.assert_called_once()


def test_normal_delete_sk_without_delimiter(mock_handler):
    mock_handler.sk_name = "sk"
    mock_handler.sk_delimiter = ""
    mock_handler.dynamodb.batch_write_item.return_value = {}
    items = [{"pk": "1", "sk": "abc"}]
    result = mock_handler.batch_delete_items(items)
    assert result is True


def test_normal_delete_without_sk(mock_handler):
    mock_handler.dynamodb.batch_write_item.return_value = {}
    items = [{"pk": "1"}]
    result = mock_handler.batch_delete_items(items)
    assert result is True


def test_normal_delete_split_batches(mock_handler):
    mock_handler.dynamodb.batch_write_item.return_value = {}
    items = [{"pk": str(i)} for i in range(26)]
    result = mock_handler.batch_delete_items(items)
    assert result is True
    # 26件 → 2回呼ばれる
    assert mock_handler.dynamodb.batch_write_item.call_count == 2


def test_normal_delete_from_json_string(mock_handler):
    mock_handler.dynamodb.batch_write_item.return_value = {}
    json_str = json.dumps([{"pk": "1"}])
    result = mock_handler.batch_delete_items(json_str)
    assert result is True


# ===== 異常系 =====

def test_invalid_json_raises_type_error(mock_handler):
    # 無効な JSON 文字列
    invalid_json_str = "{bad json}"
    with pytest.raises(TypeError):
        mock_handler.batch_delete_items(invalid_json_str)


def test_unprocessed_items_returned(mock_handler):
    mock_handler.dynamodb.batch_write_item.return_value = {"UnprocessedItems": {"TestTable": []}}
    items = [{"pk": "1"}]
    result = mock_handler.batch_delete_items(items)
    assert result is False


def test_dynamodb_exception(mock_handler):
    mock_handler.dynamodb.batch_write_item.side_effect = Exception("DynamoDB error")
    items = [{"pk": "1"}]
    result = mock_handler.batch_delete_items(items)
    assert result is False


def test_missing_pk_key_error(mock_handler):
    mock_handler.dynamodb.batch_write_item.return_value = {}
    items = [{"wrong_key": "value"}]
    with pytest.raises(KeyError):
        mock_handler.batch_delete_items(items)


def test_missing_sk_key_error(mock_handler):
    mock_handler.sk_name = "sk"
    mock_handler.sk_delimiter = "-"
    mock_handler.dynamodb.batch_write_item.return_value = {}
    items = [{"pk": "1"}]  # skキーなし
    with pytest.raises(KeyError):
        mock_handler.batch_delete_items(items)


@pytest.fixture
def mock_handler2():
    handler = DynamoDBHandler(
        region_name="ap-northeast-1",
        table_name="TestTable",
        pk_name="pk",
        sk_name="sk",
        sk_prefix="sk_prefix",
        sk_suffix="",
        sk_delimiter="#",
        field_types={"pk": "S", "sk": "S"},
        is_local=False)
    handler.query_with_pagination = MagicMock(return_value=[{"result": "ok"}])
    return handler

def test_query_by_sk_prefix_normal(mock_handler2):
    item = {"pk": "PK_VALUE", "sk_prefix": "PREFIX"}
    result = mock_handler2.query_by_sk_prefix(item)

    # 戻り値がモックの返却値であること
    assert result == [{"result": "ok"}]

    # query_with_pagination が正しいパラメータで呼ばれたか確認
    expected_params = {
        'TableName': "TestTable",
        'KeyConditionExpression': '#pk = :pk_val AND begins_with(#sk, :sk_prefix_val)',
        'ExpressionAttributeNames': {
            '#pk': 'pk',
            '#sk': 'sk'
        },
        'ExpressionAttributeValues': {
            ':pk_val': {'S': "PK_VALUE"},
            ':sk_prefix_val': {'S': "PREFIX#"}
        }
    }
    mock_handler2.query_with_pagination.assert_called_once_with(expected_params)


def test_query_by_sk_prefix_missing_pk(mock_handler2):
    item = {"sk_prefix": "PREFIX"}  # pk がない
    with pytest.raises(KeyError) as exc_info:
        mock_handler2.query_by_sk_prefix(item)
    assert f"pk:{mock_handler2.pk_name}" in str(exc_info.value)


def test_query_by_sk_prefix_missing_sk_prefix(mock_handler2):
    item = {"pk": "PK_VALUE"}  # sk_prefix がない
    with pytest.raises(KeyError) as exc_info:
        mock_handler2.query_by_sk_prefix(item)
    assert f"sk_prefix:{mock_handler2.sk_prefix}" in str(exc_info.value)



def test_query_by_pk_normal(mock_handler2):
    item = {"pk": "PK_VALUE"}
    result = mock_handler2.query_by_PK(item)

    # 戻り値がモックの返却値であること
    assert result == [{"result": "ok"}]

    # query_with_pagination が正しいパラメータで呼ばれたか
    expected_params = {
        'TableName': "TestTable",
        'KeyConditionExpression': '#pk = :pk_val',
        'ExpressionAttributeNames': {
            '#pk': 'pk'
        },
        'ExpressionAttributeValues': {
            ':pk_val': {'S': "PK_VALUE"}
        }
    }
    mock_handler2.query_with_pagination.assert_called_once_with(expected_params)


def test_query_by_pk_missing_pk(mock_handler2):
    item = {}  # pk がない
    with pytest.raises(KeyError) as exc_info:
        mock_handler2.query_by_PK(item)
    assert f"KeyError in query_by_PK: {mock_handler2.pk_name}" in str(exc_info.value)

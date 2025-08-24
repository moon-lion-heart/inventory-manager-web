import { useEffect, useState } from 'react';
import { callLambda } from '../api/lambdaApi';
import { LambdaPayload, ComponentsCRUDResponse } from '../types/lambda';
import { Component, ComponentForm } from '../types/component';
import { useOrganization } from '../context/OrganizationContext';
import { devLog } from '../utils/logger';

export const componentKeys: (keyof Component)[] = [
  'organization_id',
  'category_item_id',
  'item_id',
  'category',
  'manufacturer',
  'name',
  'type',
  'model_number',
  'year',
  'qty',
  'storage_area',
  'assign',
  'note',
  'created_at',
  'updated_at',
];

export function useComponent() {
  const [allItems, setAllItems] = useState<Component[]>([]);
  const [filteredItems, setFilteredItems] = useState<Component[]>([]);
  const [category, setCategory] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const lambdaUrl = process.env.REACT_APP_COMPONENT_LAMBDA_URL as string;
  const organizationInfo = useOrganization();
  const orgId = organizationInfo.orgInfo?.organization_id || '';

  // 追加リクエストを送信し成功した場合テーブルに反映させる
  const addItem = async (form: ComponentForm) => {
    // 空白フィールドは削除（dynamodbに保存しない）
    const cleanedForm = Object.fromEntries(
      Object.entries(form).filter(([_, value]) => value !== ''),
    );

    const payload: LambdaPayload = {
      action: 'put',
      value: {
        organization_id: orgId,
        ...cleanedForm,
      },
    };

    try {
      const response = await callLambda(lambdaUrl, payload);
      const componentsCRUDResponse = response as ComponentsCRUDResponse;
      if (componentsCRUDResponse.result === 'failure') {
        alert(componentsCRUDResponse.message);
      }

      const filledItem = fillNullFields(componentsCRUDResponse.components[0]);
      const updated = [...allItems, filledItem];
      setAllItems(updated);
      filterByCategoryManufacturerName(category, manufacturer, name, updated);
    } catch (error) {
      alert('アイテムの追加に失敗しました');
      devLog(error);
    }
  };

  // 削除リクエストを送信し成功した場合テーブルに反映させる
  const deleteItems = async (category_item_ids: string[]) => {
    const value = category_item_ids.map((category_item_id) => ({
      organization_id: orgId,
      category_item_id: category_item_id,
    }));

    const payload: LambdaPayload = {
      action: 'delete',
      value: value,
    };

    const response = await callLambda(lambdaUrl, payload);

    if ('components' in response && response.result === 'success') {
      const updated = allItems.filter((item) => !category_item_ids.includes(item.category_item_id));
      setAllItems(updated);
      filterByCategoryManufacturerName(category, manufacturer, name, updated);
    } else {
      throw new Error('Failed to delete items');
    }
  };

  // 更新リクエストを送信し成功した場合テーブルに反映させる
  const updateItem = async (rowId: string, field: string, updatedValue: string) => {
    devLog('Updating item:', rowId, field, updatedValue);
    const payload: LambdaPayload = {
      action: 'update',
      value: {
        organization_id: orgId,
        category_item_id: rowId,
        [field]: updatedValue,
      },
    };

    const response = await callLambda(lambdaUrl, payload);

    if ('components' in response && response.result === 'success') {
      const fieldName = field as keyof Component;
      const updated = getUpdatedItems(allItems, rowId, fieldName, updatedValue);
      setAllItems(updated);
      filterByCategoryManufacturerName(category, manufacturer, name, updated);
    } else {
      throw new Error('Failed to update item');
    }
  };

  const getUpdatedItems = (
    items: Component[],
    id: string,
    field: keyof Component,
    newValue: string,
  ): Component[] => {
    return items.map((item) =>
      item.category_item_id === id ? { ...item, [field]: newValue } : item,
    );
  };

  // フィルタリングしてテーブルに反映させる
  const filterByCategoryManufacturerName = (
    selectedCategory: string,
    selectedManufacturer: string,
    selectedName: string,
    items?: Component[],
  ) => {
    setCategory(selectedCategory);
    setManufacturer(selectedManufacturer);
    setName(selectedName);
    let result = items ?? allItems;
    if (selectedCategory) result = result.filter((i) => i.category === selectedCategory);
    if (selectedManufacturer)
      result = result.filter((i) => i.manufacturer === selectedManufacturer);
    if (selectedName) result = result.filter((i) => i.name.includes(selectedName));
    setFilteredItems(result);
  };

  // ログイン時organization_idが一致するアイテムを取得
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        devLog('fetchItems');
        const payload: LambdaPayload = {
          action: 'query',
          value: { organization_id: orgId },
        };
        const response = await callLambda(lambdaUrl, payload);
        const componentsCRUDResponse = response as ComponentsCRUDResponse;
        if (componentsCRUDResponse.result === 'success') {
          componentsCRUDResponse.components.map(fillNullFields);
          setAllItems(componentsCRUDResponse.components);
          setFilteredItems(componentsCRUDResponse.components);
        } else {
          setError(componentsCRUDResponse.message);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (organizationInfo.orgInfo) {
      fetchItems();
    }
    // 依存を入れると無限ループや意図しない再実行になるので無視
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationInfo.orgInfo]);

  function fillNullFields(component: Component): Component {
    const filled = { ...component };
    componentKeys.forEach((key) => {
      if (filled[key] === undefined) {
        filled[key] = '' as string;
      }
    });
    return filled;
  }

  return {
    filteredItems,
    loading,
    error,
    addItem,
    deleteItems,
    updateItem,
    filterByCategoryManufacturerName,
  };
}

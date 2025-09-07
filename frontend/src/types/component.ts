export interface Component {
  organization_id: string;
  category_item_id: string;
  item_id: string;
  category: string;
  manufacturer: string;
  name: string;
  type: string;
  model_number: string;
  year: string;
  qty: string;
  storage_area: string;
  assign: string;
  note: string;
  created_at: string;
  updated_at: string;
}

// アイテム追加フォームで使用する
export interface ComponentForm {
  category: string;
  manufacturer: string;
  name: string;
  type: string;
  model_number: string;
  year: string;
  qty: string;
  storage_area: string;
  assign: string;
  note: string;
}

// 表示するカラムのキー（InventoryItemのkey）を定義
const columns: { key: keyof Component; label: string }[] = [
  { key: 'category', label: 'カテゴリー' },
  { key: 'manufacturer', label: 'メーカー' },
  { key: 'name', label: '名称' },
  { key: 'type', label: '形式・容量' },
  { key: 'model_number', label: '製造番号' },
  { key: 'year', label: '製造年' },
  { key: 'qty', label: '数量' },
  { key: 'storage_area', label: '置き場所' },
  { key: 'assign', label: '使用件名' },
  { key: 'note', label: 'メモ' },
  { key: 'created_at', label: '追加日時' },
  { key: 'updated_at', label: '更新日時' },
];
export { columns };
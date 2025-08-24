import { renderHook, act } from '@testing-library/react';
import { useComponent } from './useComponent';
import * as lambdaApi from '../api/lambdaApi';
import * as orgContext from '../context/OrganizationContext';

jest.mock('../api/lambdaApi');
jest.mock('../context/OrganizationContext');

describe('useComponent without waitForNextUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(orgContext, 'useOrganization').mockReturnValue({
      orgInfo: { organization_id: 'org1', organization_name: '組織名' },
      setOrgInfo: jest.fn(),
    });
  });

  test('fetchItems updates state after mount', async () => {
    const mockComponents = [
      {
        organization_id: 'org1',
        category_item_id: 'id1',
        item_id: 'item1',
        category: 'cat1',
        manufacturer: 'manu1',
        name: 'name1',
        type: '',
        model_number: '',
        year: '',
        qty: '',
        storage_area: '',
        assign: '',
        note: '',
        created_at: '',
        updated_at: '',
      },
    ];

    (lambdaApi.callLambda as jest.Mock).mockResolvedValueOnce({
      result: 'success',
      components: mockComponents,
    });

    const { result } = renderHook(() => useComponent());

    // 最初はloading=true
    expect(result.current.loading).toBe(true);

    // 非同期処理の完了を待つために act + Promise.resolve()
    await act(async () => {
      // フックのuseEffect内のasync処理が完了するまで待つ
      await Promise.resolve();
      // さらにもう一度マイクロタスクキューを空にする
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.filteredItems).toEqual(mockComponents);
  });
});

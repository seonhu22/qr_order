/**
 * @fileoverview 메뉴 관리 서버 연동 계층
 *
 * @description
 * 현재 단계에서는 mock 데이터로 동작한다.
 * 실제 API 연동 시 아래 함수의 구현부만 교체한다.
 *   - fetchMenuTree → GET  /api/menus
 *   - saveMenuTree  → POST /api/menus/save
 */

import type { MenuNode } from '../types';
import { MOCK_MENU_NODES } from '../mock/systemMenuMock';

/**
 * 메뉴 트리 전체 조회
 */
export async function fetchMenuTree(): Promise<MenuNode[]> {
  // TODO: 실제 API 연동 시 교체
  // const res = await httpClient.get('/api/menus');
  // return res.data;
  await new Promise<void>((resolve) => setTimeout(resolve, 400));
  return structuredClone(MOCK_MENU_NODES);
}

/**
 * 메뉴 트리 전체 저장
 *
 * @description
 * 서버에서 new/update/delete를 비교·처리하는 방식으로 연동 예정.
 * 현재는 mock이므로 전체 트리를 그대로 전달하기만 한다.
 */
export async function saveMenuTree(_nodes: MenuNode[]): Promise<void> {
  // TODO: 실제 API 연동 시 교체
  // await httpClient.post('/api/menus/save', { nodes: _nodes });
  await new Promise<void>((resolve) => setTimeout(resolve, 600));
}

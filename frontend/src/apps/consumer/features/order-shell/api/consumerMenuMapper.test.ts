import { describe, expect, it } from 'vitest';
import type { ConsumerMenuDetailEnvelope, ConsumerMenuMainEnvelope } from '@/generated/types';
import { mapConsumerMenuDetail, mapConsumerMenuMain } from './consumerMenuMapper';

describe('consumerMenuMapper', () => {
  it('메인 응답의 카테고리, 메뉴, Consumer 전용 이미지를 화면 모델로 변환한다', () => {
    const response: ConsumerMenuMainEnvelope = {
      success: true,
      data: {
        storeName: '테스트 매장',
        tableNum: 7,
        header: { categoryList: [{ categorySysId: 'c1', categoryName: '음료' }] },
        body: {
          menuList: [
            {
              menuSysId: 'm1',
              categorySysId: 'c1',
              categoryName: '음료',
              menuName: '아메리카노',
              menuPrice: 4000,
              fileSysId: 'file id',
              menuTag: '01,03',
              optionUseYn: 'N',
              soldOutYn: 'N',
            },
          ],
        },
      },
    };

    expect(mapConsumerMenuMain(response)).toEqual({
      storeName: '테스트 매장',
      tableNum: 7,
      categories: [{ id: 'c1', name: '음료' }],
      menus: [
        expect.objectContaining({
          id: 'm1',
          imageUrl: '/api/client/consumer/menu/m1/image?v=file%20id',
          badges: ['popular', 'limited'],
          soldOut: false,
        }),
      ],
    });
  });

  it('첨부 이미지가 없으면 이미지 URL을 만들지 않는다', () => {
    expect(
      mapConsumerMenuMain({
        success: true,
        data: {
          storeName: '테스트 매장',
          tableNum: 7,
          header: { categoryList: [] },
          body: {
            menuList: [
              {
                menuSysId: 'menu/without-image',
                categorySysId: 'c1',
                categoryName: '음료',
                menuName: '물',
                menuPrice: 0,
                optionUseYn: 'N',
                soldOutYn: 'N',
              },
            ],
          },
        },
      }).menus[0].imageUrl,
    ).toBeUndefined();
  });

  it('상세 응답의 단일, 복수, 수량 옵션 계약을 보존한다', () => {
    const response: ConsumerMenuDetailEnvelope = {
      success: true,
      data: {
        body: {
          menuSysId: 'm1',
          categorySysId: 'c1',
          categoryName: '음료',
          menuName: '라테',
          menuPrice: 5000,
          optionUseYn: 'Y',
          soldOutYn: 'N',
          optionGroupList: [
            {
              optionGroupSysId: 'g1',
              groupName: '샷 추가',
              requiredYn: 'N',
              selectionType: '03',
              optionList: [
                {
                  menuOptionSysId: 'o1',
                  menuOptionName: '에스프레소 샷',
                  menuOptionPrice: 500,
                  maximumNum: 3,
                  defaultYn: 'Y',
                },
              ],
            },
          ],
        },
      },
    };

    expect(mapConsumerMenuDetail(response).optionGroups?.[0]).toEqual({
      id: 'g1',
      name: '샷 추가',
      required: false,
      selectionType: 'quantity',
      choices: [
        {
          id: 'o1',
          name: '에스프레소 샷',
          price: 500,
          maxQuantity: 3,
          defaultSelected: true,
        },
      ],
    });
  });
});

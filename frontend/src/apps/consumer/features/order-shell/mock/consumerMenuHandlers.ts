import { http, HttpResponse } from 'msw';
import type {
  ConsumerMenuDetailEnvelope,
  ConsumerMenuItem,
  ConsumerMenuMainEnvelope,
  ConsumerMenuOptionGroup,
  ConsumerMenuSearchEnvelope,
} from '@/generated/types';
import { ORDER_SHELL_CATEGORIES, ORDER_SHELL_MENU_ITEMS } from './orderShellMock';

const categoryIds = new Map<string, string>(
  ORDER_SHELL_CATEGORIES.slice(1).map((category, index) => [category, `category-${index + 1}`]),
);

function toMenuItem(item: (typeof ORDER_SHELL_MENU_ITEMS)[number]): ConsumerMenuItem {
  return {
    menuSysId: item.id,
    categorySysId: categoryIds.get(item.category) ?? '',
    categoryName: item.category,
    menuName: item.name,
    menuPrice: item.price,
    menuDescription: item.description,
    fileSysId: item.imageUrl ? `file-${item.id}` : undefined,
    menuTag: item.badges
      ?.map((badge) => ({ popular: '01', recommended: '02', limited: '03' })[badge])
      .join(','),
    optionUseYn: item.optionGroups?.length ? 'Y' : 'N',
    soldOutYn: item.soldOut ? 'Y' : 'N',
  };
}

function toOptionGroups(item: (typeof ORDER_SHELL_MENU_ITEMS)[number]): ConsumerMenuOptionGroup[] {
  if (item.id === 'menu-8') {
    return [
      {
        optionGroupSysId: 'menu-8-shot',
        groupName: '샷 추가',
        requiredYn: 'N',
        selectionType: '03',
        optionList: [
          {
            menuOptionSysId: 'menu-8-shot-espresso',
            menuOptionName: '에스프레소 샷',
            menuOptionPrice: 500,
            maximumNum: 2,
            defaultYn: 'N',
          },
        ],
      },
    ];
  }

  return (item.optionGroups ?? []).map((group) => ({
    optionGroupSysId: group.id,
    groupName: group.name,
    requiredYn: group.required ? 'Y' : 'N',
    selectionType: group.selectionType === 'single' ? '01' : '02',
    optionList: group.choices.map((choice, index) => ({
      menuOptionSysId: choice.id,
      menuOptionName: choice.name,
      menuOptionPrice: choice.price,
      maximumNum: 0,
      defaultYn: index === 0 && group.required ? 'Y' : 'N',
    })),
  }));
}

const menuList = ORDER_SHELL_MENU_ITEMS.map(toMenuItem);

const mainResponse: ConsumerMenuMainEnvelope = {
  success: true,
  data: {
    storeName: 'QR 오더 테스트 매장',
    tableNum: 3,
    header: {
      categoryList: ORDER_SHELL_CATEGORIES.slice(1).map((category) => ({
        categorySysId: categoryIds.get(category) ?? '',
        categoryName: category,
      })),
    },
    body: { menuList },
  },
};

export const consumerMenuHandlers = [
  http.get('*/api/consumer/menu/main', () => HttpResponse.json(mainResponse)),
  http.get('*/api/consumer/menu/search', ({ request }) => {
    const keyword = new URL(request.url).searchParams.get('searchKeyword')?.trim().toLowerCase();
    const response: ConsumerMenuSearchEnvelope = {
      success: true,
      data: {
        body: {
          menuList: keyword
            ? menuList.filter((item) => item.menuName.toLowerCase().includes(keyword))
            : menuList,
        },
      },
    };
    return HttpResponse.json(response);
  }),
  http.get('*/api/consumer/menu/:menuSysId', ({ params }) => {
    const item = ORDER_SHELL_MENU_ITEMS.find((menu) => menu.id === params.menuSysId);
    if (!item) return HttpResponse.json({ success: false, message: '메뉴가 없습니다.' }, { status: 404 });

    const response: ConsumerMenuDetailEnvelope = {
      success: true,
      data: {
        body: {
          ...toMenuItem(item),
          optionGroupList: toOptionGroups(item),
        },
      },
    };
    return HttpResponse.json(response);
  }),
];

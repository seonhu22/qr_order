import type {
  ConsumerMenuDetailEnvelope,
  ConsumerMenuDetailBody,
  ConsumerMenuItem,
  ConsumerMenuMainEnvelope,
  ConsumerMenuSearchEnvelope,
} from '@/generated/types';
import type {
  OrderShellMenuBadge,
  OrderShellMenuItem,
  OrderShellMenuMain,
  OrderShellOptionSelectionType,
} from '../types';

const BADGE_BY_CODE: Record<string, OrderShellMenuBadge> = {
  '01': 'popular',
  '02': 'recommended',
  '03': 'limited',
};

const SELECTION_TYPE: Record<string, OrderShellOptionSelectionType> = {
  '01': 'single',
  '02': 'multiple',
  '03': 'quantity',
};

function selectionType(code: string): OrderShellOptionSelectionType {
  const value = SELECTION_TYPE[code];
  if (!value) throw new Error('지원하지 않는 메뉴 옵션 선택 방식입니다.');
  return value;
}

function imageUrl(fileSysId?: string) {
  return fileSysId ? `/api/attach_file/view?sysId=${encodeURIComponent(fileSysId)}` : undefined;
}

function badges(menuTag?: string): OrderShellMenuBadge[] | undefined {
  const values = menuTag
    ?.split(',')
    .map((code) => BADGE_BY_CODE[code.trim()])
    .filter((badge): badge is OrderShellMenuBadge => Boolean(badge));
  return values?.length ? values : undefined;
}

export function mapConsumerMenuItem(item: ConsumerMenuItem): OrderShellMenuItem {
  return {
    id: item.menuSysId,
    name: item.menuName,
    category: item.categoryName,
    price: item.menuPrice,
    description: item.menuDescription,
    imageUrl: imageUrl(item.fileSysId),
    soldOut: item.soldOutYn === 'Y',
    badges: badges(item.menuTag),
  };
}

function mapDetailBody(item: ConsumerMenuDetailBody): OrderShellMenuItem {
  return {
    ...mapConsumerMenuItem(item),
    optionGroups: item.optionGroupList.map((group) => ({
      id: group.optionGroupSysId,
      name: group.groupName,
      required: group.requiredYn === 'Y',
      selectionType: selectionType(group.selectionType),
      choices: group.optionList.map((choice) => ({
        id: choice.menuOptionSysId,
        name: choice.menuOptionName,
        price: choice.menuOptionPrice,
        maxQuantity: group.selectionType === '03' ? choice.maximumNum : undefined,
        defaultSelected: choice.defaultYn === 'Y',
      })),
    })),
  };
}

export function mapConsumerMenuMain(envelope: ConsumerMenuMainEnvelope): OrderShellMenuMain {
  return {
    storeName: envelope.data.storeName,
    tableNum: envelope.data.tableNum,
    categories: envelope.data.header.categoryList.map((category) => ({
      id: category.categorySysId,
      name: category.categoryName,
    })),
    menus: envelope.data.body.menuList.map(mapConsumerMenuItem),
  };
}

export function mapConsumerMenuSearch(envelope: ConsumerMenuSearchEnvelope) {
  return envelope.data.body.menuList.map(mapConsumerMenuItem);
}

export function mapConsumerMenuDetail(envelope: ConsumerMenuDetailEnvelope) {
  return mapDetailBody(envelope.data.body);
}

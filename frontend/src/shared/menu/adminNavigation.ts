import type { SidebarNavDepth1, SidebarNavGroup, SidebarNavItem } from '@/shared/components/sidebar/types';
import { findBestPathMatch, findMenuByPath, normalizeMenuPath, type MenuCatalogItem } from './menuCatalog';

export type AdminHeaderSection = string;

export type AdminMenuTreeNode = MenuCatalogItem & {
  children: AdminMenuTreeNode[];
};

export type AdminMenuBreadcrumb = {
  depth1: string;
  depth2: string;
  current: string;
};

export type AdminSidebarNavigation = {
  section: AdminHeaderSection;
  depth1Key: string;
  depth1Label: string;
  depth2Key: string;
  depth2Label: string;
  itemKey: string;
  itemLabel: string;
  path: string;
};

export type AdminNavigationData = {
  headerSections: { section: AdminHeaderSection; label: string }[];
  menusBySection: Record<string, SidebarNavDepth1[]>;
  currentSection: AdminHeaderSection | null;
  currentMenus: SidebarNavDepth1[];
  currentNavigation?: AdminSidebarNavigation;
  currentMenu?: MenuCatalogItem;
  breadcrumb?: AdminMenuBreadcrumb;
};

const ROOT_PARENT_MENU_CD = 'ROOT';

function sortByOrdNo<T extends { ordNo: number }>(items: readonly T[]) {
  return [...items].sort((a, b) => a.ordNo - b.ordNo);
}

function dedupeMenuItems(items: readonly MenuCatalogItem[]) {
  const uniqueByMenuCd = new Map<string, MenuCatalogItem>();

  for (const item of sortByOrdNo(items)) {
    if (!item.menuCd || uniqueByMenuCd.has(item.menuCd)) {
      continue;
    }

    uniqueByMenuCd.set(item.menuCd, item);
  }

  return [...uniqueByMenuCd.values()];
}

function createsParentCycle(
  item: MenuCatalogItem,
  itemByMenuCd: ReadonlyMap<string, MenuCatalogItem>,
) {
  const visited = new Set<string>([item.menuCd]);
  let cursor = item.parentMenuCd?.trim();

  while (cursor && cursor !== ROOT_PARENT_MENU_CD) {
    if (visited.has(cursor)) {
      return true;
    }

    visited.add(cursor);
    const parent = itemByMenuCd.get(cursor);
    if (!parent) {
      return false;
    }

    cursor = parent.parentMenuCd?.trim();
  }

  return false;
}

function createLeafItem(node: AdminMenuTreeNode): SidebarNavItem[] {
  if (!node.path) {
    return [];
  }

  return [
    {
      key: node.menuCd,
      label: node.menuNm,
      path: node.path,
    },
  ];
}

function collectNavigableDescendants(node: AdminMenuTreeNode): SidebarNavItem[] {
  const descendants = node.children.flatMap((child) => collectNavigableDescendants(child));
  return descendants.length > 0 ? descendants : createLeafItem(node);
}

function flattenSidebarItems(menus: readonly SidebarNavDepth1[]) {
  return menus.flatMap((depth1) =>
    depth1.groups.flatMap((group) =>
      group.items.map((item) => ({
        section: depth1.key,
        depth1Key: depth1.key,
        depth1Label: depth1.label,
        depth2Key: group.key,
        depth2Label: group.label,
        itemKey: item.key,
        itemLabel: item.label,
        path: item.path,
      })),
    ),
  );
}

function findLineageByMenuCd(
  nodes: readonly AdminMenuTreeNode[],
  menuCd?: string | null,
): AdminMenuTreeNode[] | undefined {
  if (!menuCd) {
    return undefined;
  }

  for (const node of nodes) {
    if (node.menuCd === menuCd) {
      return [node];
    }

    const childLineage = findLineageByMenuCd(node.children, menuCd);
    if (childLineage) {
      return [node, ...childLineage];
    }
  }

  return undefined;
}

function buildGroupItems(group: AdminMenuTreeNode): SidebarNavItem[] {
  const descendants = group.children.flatMap((child) => collectNavigableDescendants(child));
  return descendants.length > 0 ? descendants : createLeafItem(group);
}

function buildSidebarMenusForSection(sectionNode: AdminMenuTreeNode): SidebarNavDepth1[] {
  const groups: SidebarNavGroup[] = sectionNode.children
    .map((group) => ({
      key: group.menuCd,
      label: group.menuNm,
      items: buildGroupItems(group),
    }))
    .filter((group) => group.items.length > 0);

  if (groups.length === 0) {
    const sectionItems = createLeafItem(sectionNode);
    if (sectionItems.length === 0) {
      return [];
    }

    return [
      {
        key: sectionNode.menuCd,
        label: sectionNode.menuNm,
        groups: [
          {
            key: `${sectionNode.menuCd}__root`,
            label: sectionNode.menuNm,
            items: sectionItems,
          },
        ],
      },
    ];
  }

  return [
    {
      key: sectionNode.menuCd,
      label: sectionNode.menuNm,
      groups,
    },
  ];
}

export function buildAdminMenuTree(items: readonly MenuCatalogItem[]): AdminMenuTreeNode[] {
  const normalizedItems = dedupeMenuItems(items);
  const itemByMenuCd = new Map(normalizedItems.map((item) => [item.menuCd, item]));
  const nodeByMenuCd = new Map<string, AdminMenuTreeNode>();
  const roots: AdminMenuTreeNode[] = [];

  sortByOrdNo(normalizedItems).forEach((item) => {
    nodeByMenuCd.set(item.menuCd, {
      ...item,
      children: [],
    });
  });

  sortByOrdNo(normalizedItems).forEach((item) => {
    const node = nodeByMenuCd.get(item.menuCd);
    if (!node) {
      return;
    }

    const parentMenuCd = item.parentMenuCd?.trim();
    const parentNode = parentMenuCd ? nodeByMenuCd.get(parentMenuCd) : undefined;

    if (
      !parentMenuCd ||
      parentMenuCd === ROOT_PARENT_MENU_CD ||
      !parentNode ||
      parentMenuCd === item.menuCd ||
      createsParentCycle(item, itemByMenuCd)
    ) {
      roots.push(node);
      return;
    }

    parentNode.children.push(node);
  });

  function sortTree(nodes: AdminMenuTreeNode[]): AdminMenuTreeNode[] {
    return sortByOrdNo(nodes).map((node) => ({
      ...node,
      children: sortTree(node.children),
    }));
  }

  return sortTree(roots);
}

export function createAdminNavigationData(
  items: readonly MenuCatalogItem[],
  pathname: string,
): AdminNavigationData {
  const normalizedPathname = normalizeMenuPath(pathname);
  const normalizedItems = dedupeMenuItems(items);
  const tree = buildAdminMenuTree(normalizedItems);

  const sectionEntries = tree
    .map((sectionNode) => ({
      sectionNode,
      menus: buildSidebarMenusForSection(sectionNode),
    }))
    .filter((entry) => entry.menus.length > 0);

  const headerSections = sectionEntries.map(({ sectionNode }) => ({
    section: sectionNode.menuCd,
    label: sectionNode.menuNm,
  }));

  const menusBySection = Object.fromEntries(
    sectionEntries.map(({ sectionNode, menus }) => [sectionNode.menuCd, menus]),
  ) as Record<string, SidebarNavDepth1[]>;

  const currentMenu = findMenuByPath(
    {
      items: [...normalizedItems],
      byMenuCd: new Map(normalizedItems.map((item) => [item.menuCd, item])),
      byPath: new Map(normalizedItems.filter((item) => item.path).map((item) => [item.path, item])),
    },
    normalizedPathname,
  );

  const allMenus = Object.values(menusBySection).flat();
  const matchedNavigation = findBestPathMatch(flattenSidebarItems(allMenus), normalizedPathname);
  const currentNavigation = matchedNavigation
    ? {
        section: matchedNavigation.section,
        depth1Key: matchedNavigation.depth1Key,
        depth1Label: matchedNavigation.depth1Label,
        depth2Key: matchedNavigation.depth2Key,
        depth2Label: matchedNavigation.depth2Label,
        itemKey: matchedNavigation.itemKey,
        itemLabel: matchedNavigation.itemLabel,
        path: matchedNavigation.path,
      }
    : undefined;

  const lineage = findLineageByMenuCd(tree, currentMenu?.menuCd);
  const sectionNode = lineage?.[0];
  const currentSection = currentNavigation?.section ?? sectionNode?.menuCd ?? null;
  const currentMenus = currentSection ? menusBySection[currentSection] ?? [] : [];

  const breadcrumb =
    lineage && lineage.length > 0 && currentMenu
      ? {
          depth1: lineage[0]?.menuNm ?? '',
          depth2:
            (lineage.length > 1 ? lineage[lineage.length - 2]?.menuNm : undefined) ??
            lineage[0]?.menuNm ??
            '',
          current: currentMenu.menuNm,
        }
      : undefined;

  return {
    headerSections,
    menusBySection,
    currentSection,
    currentMenus,
    currentNavigation,
    currentMenu,
    breadcrumb,
  };
}

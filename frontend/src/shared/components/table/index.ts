/**
 * @fileoverview Table 컴포넌트 공개 API 진입점
 *
 * @example
 * import { TableCard } from '@/shared/components/table';
 * import type { TableCardProps } from '@/shared/components/table';
 */

export { TableCard } from './TableCard';
export { TableCardContentState } from './TableCardContentState';
export { TableBodyRenderer } from './TableBodyRenderer';
export { DetailTableActions, EditableTableActions, MasterTableActions } from './TableActionGroups';
export { EditableMasterTable } from './EditableMasterTable';

export type { TableCardProps } from './types';
export type { SharedTableCell, SharedTableColumn, SharedTableRow } from './tableModelTypes';

import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/assets/icons/Icon';
import type { SharedTableColumn, SharedTableRow } from '@/shared/components/table';
import type { PlantSearchRow } from '../types';

export function createPlantSearchTableColumns(): SharedTableColumn[] {
  return [
    { key: 'plantCode', label: '사업자 코드' },
    { key: 'plantName', label: '사업자 명' },
    { key: 'storeName', label: '상호명' },
    { key: 'ownerName', label: '대표자명', tdClassName: 'common-table__cell--center' },
    { key: 'email', label: '이메일 주소' },
    { key: 'managerName', label: '담당자 명', tdClassName: 'common-table__cell--center' },
    { key: 'postalCode', label: '우편번호', tdClassName: 'common-table__cell--center' },
    { key: 'address', label: '주소' },
    { key: 'phoneNumber', label: '전화번호' },
    { key: 'clientUrl', label: '클라이언트 접속' },
  ];
}

export function createPlantSearchTableRows(rows: PlantSearchRow[]): SharedTableRow[] {
  return rows.map((row) => {
    const hasClientUrl = row.clientUrl && row.clientUrl !== '-';

    return {
      id: row.id,
      cells: {
        plantCode: {
          type: 'text',
          value: row.plantCode,
          className: 'common-table__mono',
          title: row.plantCode,
        },
        plantName: {
          type: 'text',
          value: row.plantName,
          className: 'common-table__cell--truncate',
          title: row.plantName,
        },
        storeName: {
          type: 'text',
          value: row.storeName,
          className: 'common-table__cell--truncate',
          title: row.storeName,
        },
        ownerName: {
          type: 'text',
          value: row.ownerName,
          className: 'plant-search-page__muted common-table__cell--truncate',
          title: row.ownerName,
        },
        email: {
          type: 'text',
          value: row.email,
          className: 'plant-search-page__muted common-table__cell--truncate',
          title: row.email,
        },
        managerName: {
          type: 'text',
          value: row.managerName,
          className: 'plant-search-page__muted common-table__cell--truncate',
          title: row.managerName,
        },
        postalCode: {
          type: 'text',
          value: row.postalCode,
          className: 'plant-search-page__muted',
          title: row.postalCode,
        },
        address: {
          type: 'text',
          value: row.address,
          className: 'plant-search-page__muted common-table__cell--truncate',
          title: row.address,
        },
        phoneNumber: {
          type: 'text',
          value: row.phoneNumber,
          className: 'plant-search-page__muted common-table__cell--truncate',
          title: row.phoneNumber,
        },
        clientUrl: {
          type: 'custom',
          render: () => (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="plant-search-page__access-button"
              rightIcon={<Icon id="i-plant-access" size={11} />}
              disabled={!hasClientUrl}
              onClick={() => window.open(row.clientUrl, '_blank')}
            >
              접속
            </Button>
          ),
        },
      },
    };
  });
}

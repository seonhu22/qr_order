/**
 * @fileoverview PlantSearchTable 컴포넌트 테스트
 *
 * @description
 * - 로딩/에러/빈 결과/정상 결과 렌더링을 검증한다.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlantSearchTable } from './PlantSearchTable';

describe('PlantSearchTable', () => {
  it('renders loading message when loading', () => {
    render(<PlantSearchTable rows={[]} isLoading isError={false} />);

    expect(screen.getByText('사업장 목록을 불러오는 중입니다.')).toBeInTheDocument();
  });

  it('prioritizes loading state over error state', () => {
    render(<PlantSearchTable rows={[]} isLoading isError />);

    // 분기 우선순위 회귀 방지: 로딩 중에는 에러 문구보다 로딩 문구가 우선되어야 한다.
    expect(screen.getByText('사업장 목록을 불러오는 중입니다.')).toBeInTheDocument();
    expect(screen.queryByText('사업장 목록을 불러오지 못했습니다.')).not.toBeInTheDocument();
  });

  it('renders error message when query fails', () => {
    render(<PlantSearchTable rows={[]} isLoading={false} isError />);

    expect(screen.getByText('사업장 목록을 불러오지 못했습니다.')).toBeInTheDocument();
  });

  it('renders empty message when rows are empty', () => {
    render(<PlantSearchTable rows={[]} isLoading={false} isError={false} />);

    expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('renders plant rows when data exists', () => {
    render(
      <PlantSearchTable
        rows={[
          {
            id: 'plant-1',
            plantCode: 'PLANT-001',
            plantName: '강남점',
            storeName: '강남 매장',
            email: 'gangnam@example.com',
            postalCode: '06123',
            address: '서울 강남구',
            phoneNumber: '02-1234-5678',
            useYn: 'Y',
          },
        ]}
        isLoading={false}
        isError={false}
      />,
    );

    expect(screen.getByText('PLANT-001')).toBeInTheDocument();
    expect(screen.getByText('강남점')).toBeInTheDocument();
    expect(screen.getByText('강남 매장')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '접속' })).toBeInTheDocument();
  });

  it('calls onAccessClick with the selected row when access button is clicked', () => {
    const onAccessClick = vi.fn();
    const row = {
      id: 'plant-1',
      plantCode: 'PLANT-001',
      plantName: '강남점',
      storeName: '강남 매장',
      email: 'gangnam@example.com',
      postalCode: '06123',
      address: '서울 강남구',
      phoneNumber: '02-1234-5678',
      useYn: 'Y' as const,
    };

    render(
      <PlantSearchTable
        rows={[row]}
        isLoading={false}
        isError={false}
        onAccessClick={onAccessClick}
      />,
    );

    // 테이블 액션 계약 회귀 방지: 어떤 행에서 클릭했는지 콜백으로 전달되어야 한다.
    fireEvent.click(screen.getByRole('button', { name: '접속' }));

    expect(onAccessClick).toHaveBeenCalledWith(row);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlantStatusTable } from './PlantStatusTable';

describe('PlantStatusTable', () => {
  it('renders error feedback when query fails', () => {
    render(<PlantStatusTable rows={[]} isLoading={false} isError />);

    expect(screen.getByText('불러오는데 실패했습니다')).toBeInTheDocument();
    expect(screen.getByText('다시 한번 시도해주세요.')).toBeInTheDocument();
  });
});

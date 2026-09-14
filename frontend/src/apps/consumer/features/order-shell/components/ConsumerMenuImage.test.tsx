import { act, fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConsumerMenuImage } from './ConsumerMenuImage';

describe('ConsumerMenuImage', () => {
  it('이미지 URL이 없으면 기본 아이콘을 보여준다', () => {
    const { container } = render(
      <ConsumerMenuImage imageClassName="menu-image" fallbackIconSize={20} />,
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('이미지 로드가 실패하면 기본 아이콘으로 교체한다', () => {
    const { container } = render(
      <ConsumerMenuImage
        imageUrl="/api/client/consumer/menu/m1/image"
        imageClassName="menu-image"
        fallbackIconSize={20}
      />,
    );

    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', '/api/client/consumer/menu/m1/image');

    fireEvent.error(image!);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('이미지 URL이 바뀌면 새 URL을 다시 로드한다', () => {
    const { container, rerender } = render(
      <ConsumerMenuImage
        imageUrl="/api/client/consumer/menu/m1/image"
        imageClassName="menu-image"
        fallbackIconSize={20}
      />,
    );

    fireEvent.error(container.querySelector('img')!);
    rerender(
      <ConsumerMenuImage
        imageUrl="/api/client/consumer/menu/m2/image"
        imageClassName="menu-image"
        fallbackIconSize={20}
      />,
    );

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/api/client/consumer/menu/m2/image',
    );
  });

  it('온라인으로 복귀하면 실패한 이미지를 다시 로드한다', () => {
    const { container } = render(
      <ConsumerMenuImage
        imageUrl="/api/client/consumer/menu/m1/image"
        imageClassName="menu-image"
        fallbackIconSize={20}
      />,
    );

    fireEvent.error(container.querySelector('img')!);
    act(() => window.dispatchEvent(new Event('online')));

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/api/client/consumer/menu/m1/image',
    );
  });
});

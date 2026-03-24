// src/shared/components/icon/StatusInfoIcon.tsx

/**
 * @fileoverview 상태 안내형 information 아이콘
 *
 * @description
 * - StatusModal을 포함한 상태 전달 UI에서 재사용하는 공용 아이콘이다.
 * - `currentColor` 기반으로 동작하므로, 래퍼의 텍스트 색상 또는 className으로 색을 제어한다.
 * - 크기와 스타일은 `className` 또는 width/height props로 확장할 수 있도록 단순한 구조를 유지한다.
 *
 * @example
 * <StatusInfoIcon className="status-modal__icon" />
 */

type StatusInfoIconProps = {
  className?: string;
};

/**
 * 상태 안내용 information 아이콘을 렌더링한다.
 *
 * @param {StatusInfoIconProps} props 아이콘 표시 옵션
 * @param {string} [props.className] SVG에 전달할 추가 클래스명
 * @returns {JSX.Element} currentColor 기반 SVG 아이콘
 *
 * @example
 * <StatusInfoIcon className="status-modal__icon-svg" />
 */
export function StatusInfoIcon({ className }: StatusInfoIconProps) {
  return (
    // TODO : 추후 SVG 파일을 넣을 수 있게 해야한다.
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="28"
      viewBox="0 0 28 28"
      width="28"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 25.6666C20.4433 25.6666 25.6667 20.4433 25.6667 14C25.6667 7.55666 20.4433 2.33331 14 2.33331C7.55669 2.33331 2.33334 7.55666 2.33334 14C2.33334 20.4433 7.55669 25.6666 14 25.6666Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.33333"
      />
      <path
        d="M14 18.6667V14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.33333"
      />
      <path
        d="M14 9.33331H14.0117"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.33333"
      />
    </svg>
  );
}

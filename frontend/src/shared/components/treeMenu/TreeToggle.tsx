import { Icon } from '@/shared/assets/icons/Icon';


type TreeToggleProps = {
  expanded: boolean;
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  'aria-label'?: string;
};

/** 펼치기/접기 토글 버튼. 자식 노드가 있는 행에만 렌더된다. */
export function TreeToggle({
  expanded,
  onToggle,
  'aria-label': ariaLabel,
}: TreeToggleProps) {
  return (
    <button
      type="button"
      className={`tree-toggle${expanded ? ' tree-toggle--expanded' : ''}`}
      onClick={onToggle}
      aria-label={ariaLabel ?? (expanded ? '접기' : '펼치기')}
      aria-expanded={expanded}
    >
      <Icon id="i-chevron-right" size={11} />
    </button>
  );
}

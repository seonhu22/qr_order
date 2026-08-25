import type { OrderShellOptionChoice, OrderShellOptionGroup } from '../types';
import './MenuOptionGroupList.css';

type MenuOptionGroupListProps = {
  groups: OrderShellOptionGroup[];
  isChoiceSelected: (groupId: string, choiceId: string) => boolean;
  isChoiceDisabled: (group: OrderShellOptionGroup, choice: OrderShellOptionChoice) => boolean;
  onToggleChoice: (group: OrderShellOptionGroup, choiceId: string) => void;
  getChoiceQuantity: (groupId: string, choiceId: string) => number;
  onIncreaseChoiceQuantity: (group: OrderShellOptionGroup, choice: OrderShellOptionChoice) => void;
  onDecreaseChoiceQuantity: (group: OrderShellOptionGroup, choice: OrderShellOptionChoice) => void;
};

function formatOptionPrice(price: number) {
  if (price === 0) return '';
  return `${price > 0 ? '+' : '-'}${Math.abs(price).toLocaleString()}원`;
}

function groupHint(group: OrderShellOptionGroup) {
  if (group.selectionType === 'single') return '1개 선택';
  if (group.selectionType === 'quantity') return '수량 선택';
  if (group.maxSelectable !== undefined) return `최대 ${group.maxSelectable}개 선택`;
  return '복수 선택 가능';
}

/**
 * 메뉴 상세 시트의 옵션 영역.
 *
 * 옵션이 없는 메뉴면 아무것도 렌더링하지 않는다 — 현재 대부분의 mock 메뉴가 이 경우다.
 * 단일 선택은 `radio`, 복수 선택은 `checkbox`로 렌더링해 키보드·스크린리더 동작을 브라우저에 맡긴다.
 */
export function MenuOptionGroupList({
  groups,
  isChoiceSelected,
  isChoiceDisabled,
  onToggleChoice,
  getChoiceQuantity,
  onIncreaseChoiceQuantity,
  onDecreaseChoiceQuantity,
}: MenuOptionGroupListProps) {
  if (groups.length === 0) return null;

  return (
    <div className="menu-option-groups">
      {groups.map((group) => (
        <fieldset key={group.id} className="menu-option-group">
          <legend className="menu-option-group__legend">
            <span className="menu-option-group__name">{group.name}</span>
            <span
              className={`menu-option-group__tag${
                group.required ? ' menu-option-group__tag--required' : ''
              }`}
            >
              {group.required ? '필수' : '선택'}
            </span>
            <span className="menu-option-group__hint">{groupHint(group)}</span>
          </legend>

          <ul className="menu-option-group__choices">
            {group.choices.map((choice) => {
              const selected = isChoiceSelected(group.id, choice.id);
              const disabled = isChoiceDisabled(group, choice);
              const priceLabel = formatOptionPrice(choice.price);

              if (group.selectionType === 'quantity') {
                const quantity = getChoiceQuantity(group.id, choice.id);
                const maximum = choice.maxQuantity ?? 1;
                return (
                  <li key={choice.id} className="menu-option-choice menu-option-choice--quantity">
                    <span className="menu-option-choice__name">{choice.name}</span>
                    {priceLabel && <span className="menu-option-choice__price">{priceLabel}</span>}
                    <div className="menu-option-choice__stepper">
                      <button
                        type="button"
                        aria-label={`${choice.name} 수량 줄이기`}
                        disabled={quantity === 0}
                        onClick={() => onDecreaseChoiceQuantity(group, choice)}
                      >
                        −
                      </button>
                      <span aria-label={`${choice.name} 선택 수량`}>{quantity}</span>
                      <button
                        type="button"
                        aria-label={`${choice.name} 수량 늘리기`}
                        disabled={choice.soldOut || quantity >= maximum}
                        onClick={() => onIncreaseChoiceQuantity(group, choice)}
                      >
                        +
                      </button>
                    </div>
                  </li>
                );
              }

              return (
                <li key={choice.id}>
                  <label
                    className={`menu-option-choice${
                      disabled ? ' menu-option-choice--disabled' : ''
                    }`}
                  >
                    <input
                      type={group.selectionType === 'single' ? 'radio' : 'checkbox'}
                      name={group.id}
                      className="menu-option-choice__input"
                      checked={selected}
                      disabled={disabled}
                      onChange={() => onToggleChoice(group, choice.id)}
                    />
                    <span className="menu-option-choice__name">
                      {choice.name}
                      {choice.soldOut && (
                        <span className="menu-option-choice__soldout">품절</span>
                      )}
                    </span>
                    {priceLabel && (
                      <span className="menu-option-choice__price">{priceLabel}</span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}
    </div>
  );
}

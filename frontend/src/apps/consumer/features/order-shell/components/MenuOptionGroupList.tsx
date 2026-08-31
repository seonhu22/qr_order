import { Badge } from '@/shared/components/badge';
import { RadioInput } from '@/shared/components/radio';
import { CheckboxInput } from '@/shared/components/checkbox';
import type { OrderShellOptionChoice, OrderShellOptionGroup } from '../types';
import { QuantityStepperButton } from './QuantityStepperButton';
import './MenuOptionGroupList.css';

type MenuOptionGroupListProps = {
  groups: OrderShellOptionGroup[];
  isChoiceSelected: (groupId: string, choiceId: string) => boolean;
  isChoiceDisabled: (group: OrderShellOptionGroup, choice: OrderShellOptionChoice) => boolean;
  onToggleChoice: (group: OrderShellOptionGroup, choiceId: string) => void;
  getChoiceQuantity: (groupId: string, choiceId: string) => number;
  onIncreaseChoiceQuantity: (group: OrderShellOptionGroup, choice: OrderShellOptionChoice) => void;
  onDecreaseChoiceQuantity: (group: OrderShellOptionGroup, choice: OrderShellOptionChoice) => void;
  getChoiceQty: (groupId: string, choiceId: string) => number;
  onIncreaseChoiceQty: (group: OrderShellOptionGroup, choiceId: string) => void;
  onDecreaseChoiceQty: (group: OrderShellOptionGroup, choiceId: string) => void;
};

function formatOptionPrice(price: number) {
  if (price === 0) return '';
  return `${price > 0 ? '+' : '-'}${Math.abs(price).toLocaleString()}원`;
}

/**
 * 메뉴 상세 시트의 옵션 영역.
 *
 * 옵션이 없는 메뉴면 아무것도 렌더링하지 않는다 — 현재 대부분의 mock 메뉴가 이 경우다.
 * 체크 표시 자체(원/박스)는 `/dev/radio`·`/dev/checkbox`의 `RadioInput`/`CheckboxInput`을 그대로
 * 가져다 쓰되, 그 컴포넌트의 `label`/`description`은 사용하지 않는다 — 이름·가격 표기는
 * 이 화면 전용 카드형 레이아웃(`menu-option-choice`)이 따로 맡는다. 대신 컨트롤에 `id`를 직접 주고
 * 이름 텍스트를 그 `id`를 가리키는 별도의 `<label>`로 감싸 접근성 이름(스크린리더·테스트의
 * `getByRole(..., { name })`)이 여전히 정상적으로 연결되게 한다.
 * 복수 선택 항목은 선택되면 개수를 조절할 수 있는 미니 수량 버튼이 함께 나타난다.
 * 품절 항목은 별도 표시 없이 선택만 막는다(`isChoiceDisabled`) — 이름은 그대로 보여준다.
 */
export function MenuOptionGroupList({
  groups,
  isChoiceSelected,
  isChoiceDisabled,
  onToggleChoice,
  getChoiceQuantity,
  onIncreaseChoiceQuantity,
  onDecreaseChoiceQuantity,
  getChoiceQty,
  onIncreaseChoiceQty,
  onDecreaseChoiceQty,
}: MenuOptionGroupListProps) {
  if (groups.length === 0) return null;

  return (
    <div className="menu-option-groups">
      {groups.map((group) => (
        <fieldset key={group.id} className="menu-option-group">
          <legend className="menu-option-group__legend">
            <span className="menu-option-group__name">{group.name}</span>
            <span className="menu-option-group__meta">
              {group.selectionType === 'multiple' && <Badge tone="neutral">복수선택</Badge>}
              <Badge tone={group.required ? 'brand' : 'neutral'}>
                {group.required ? '필수' : '선택'}
              </Badge>
            </span>
          </legend>

          <ul className="menu-option-group__choices">
            {group.choices.map((choice) => {
              const selected = isChoiceSelected(group.id, choice.id);
              const disabled = isChoiceDisabled(group, choice);
              const priceLabel = formatOptionPrice(choice.price);
              const inputId = `${group.id}-${choice.id}`;

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
                <li
                  key={choice.id}
                  className={`menu-option-choice${
                    selected ? ' menu-option-choice--selected' : ''
                  }${disabled ? ' menu-option-choice--disabled' : ''}`}
                >
                  {group.selectionType === 'single' ? (
                    <RadioInput
                      id={inputId}
                      name={group.id}
                      value={choice.id}
                      checked={selected}
                      disabled={disabled}
                      onChange={() => onToggleChoice(group, choice.id)}
                    />
                  ) : (
                    <CheckboxInput
                      id={inputId}
                      checked={selected}
                      disabled={disabled}
                      onChange={() => onToggleChoice(group, choice.id)}
                    />
                  )}

                  <label htmlFor={inputId} className="menu-option-choice__text">
                    <span className="menu-option-choice__name">{choice.name}</span>
                  </label>

                  {group.selectionType === 'multiple' && selected && (
                    <div className="menu-option-choice__qty">
                      <QuantityStepperButton
                        icon="minus"
                        className="menu-option-choice__qty-button"
                        iconSize={10}
                        disabled={getChoiceQty(group.id, choice.id) <= 1}
                        onClick={() => onDecreaseChoiceQty(group, choice.id)}
                        ariaLabel={`${choice.name} 수량 줄이기`}
                      />
                      <output className="menu-option-choice__qty-value" aria-label={`${choice.name} 수량`}>
                        {getChoiceQty(group.id, choice.id)}
                      </output>
                      <QuantityStepperButton
                        icon="plus"
                        className="menu-option-choice__qty-button"
                        iconSize={10}
                        onClick={() => onIncreaseChoiceQty(group, choice.id)}
                        ariaLabel={`${choice.name} 수량 늘리기`}
                      />
                    </div>
                  )}

                  {priceLabel && (
                    <span className="menu-option-choice__price">{priceLabel}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}
    </div>
  );
}

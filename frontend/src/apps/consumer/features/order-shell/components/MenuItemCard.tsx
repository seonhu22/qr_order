import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import { MENU_BADGE_CONFIG } from '../badgeConfig';
import type { OrderShellMenuItem } from '../types';
import { ConsumerMenuImage } from './ConsumerMenuImage';
import './MenuItemCard.css';

type MenuItemCardProps = {
  item: OrderShellMenuItem;
  onSelect: () => void;
  /** mock 데이터의 정적 soldOut과 별개로, 품절 확인 모달을 거쳐 실시간으로 품절 처리된 경우. */
  runtimeSoldout?: boolean;
};

export function MenuItemCard({ item, onSelect, runtimeSoldout = false }: MenuItemCardProps) {
  const soldOut = item.soldOut || runtimeSoldout;

  return (
    <button type="button" className="menu-item-card" onClick={onSelect} disabled={soldOut}>
      <div className="menu-item-card__thumb" aria-hidden="true">
        <ConsumerMenuImage
          imageUrl={item.imageUrl}
          imageClassName="menu-item-card__image"
          fallbackIconSize={20}
        />
        {soldOut && <span className="menu-item-card__soldout-badge">품절</span>}
      </div>
      <div className="menu-item-card__body">
        {item.badges && item.badges.length > 0 && (
          <div className="menu-item-card__badges">
            {item.badges.map((badge) => {
              const { label, iconId } = MENU_BADGE_CONFIG[badge];
              return (
                <span
                  key={badge}
                  className={`menu-item-card__badge menu-item-card__badge--${badge}`}
                >
                  <ConsumerIcon id={iconId} size={9} />
                  {label}
                </span>
              );
            })}
          </div>
        )}
        <p className="menu-item-card__name">{item.name}</p>
        {item.description && <p className="menu-item-card__description">{item.description}</p>}
        <div className="menu-item-card__price-row">
          <span className="menu-item-card__price">{item.price.toLocaleString()}원</span>
          {!soldOut && (
            <span className="menu-item-card__add" aria-hidden="true">
              <ConsumerIcon id="ci-plus" size={16} />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

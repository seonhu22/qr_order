import { ConsumerIcon } from '@/apps/consumer/shared/icons/ConsumerIcon';
import { MENU_BADGE_CONFIG } from '../badgeConfig';
import type { OrderShellMenuItem } from '../types';
import './MenuItemCard.css';

type MenuItemCardProps = {
  item: OrderShellMenuItem;
  onSelect: () => void;
};

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  return (
    <button type="button" className="menu-item-card" onClick={onSelect} disabled={item.soldOut}>
      <div className="menu-item-card__thumb" aria-hidden="true">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="menu-item-card__image" />
        ) : (
          <ConsumerIcon id="ci-utensils" size={20} />
        )}
        {item.soldOut && <span className="menu-item-card__soldout-badge">품절</span>}
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
          {!item.soldOut && (
            <span className="menu-item-card__add" aria-hidden="true">
              <ConsumerIcon id="ci-plus" size={16} />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

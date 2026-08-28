import './CategoryTabs.css';

type CategoryTabsProps = {
  categories: readonly string[];
  selected: string;
  onSelect: (category: string) => void;
};

export function CategoryTabs({ categories, selected, onSelect }: CategoryTabsProps) {
  return (
    <div className="category-tabs" role="tablist" aria-label="메뉴 카테고리">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          role="tab"
          aria-selected={selected === category}
          className={`category-tabs__item${selected === category ? ' category-tabs__item--active' : ''}`}
          onClick={() => onSelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

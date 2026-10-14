import { PRODUCT_CATEGORIES, type ProductCategory } from '@shared/types';

export interface CategoryFilterProps {
  value: ProductCategory | 'all';
  onChange: (category: ProductCategory | 'all') => void;
}

const LABELS: Record<ProductCategory | 'all', string> = {
  all: 'Todas',
  calzado: 'Calzado',
  indumentaria: 'Indumentaria',
  mochilas: 'Mochilas',
  campamento: 'Campamento',
  accesorios: 'Accesorios',
};

/** Chips de categoria, scrolleables horizontalmente en mobile. */
export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const categories: (ProductCategory | 'all')[] = ['all', ...PRODUCT_CATEGORIES];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrar por categoria">
      {categories.map((category) => {
        const isActive = category === value;
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(category)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {LABELS[category]}
          </button>
        );
      })}
    </div>
  );
}

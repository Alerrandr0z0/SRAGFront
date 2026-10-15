import type { KeyboardEvent } from 'react';

export interface TabSection<T extends string> {
  id: T;
  label: string;
  description: string;
}

interface SectionTabsProps<T extends string> {
  sections: readonly TabSection<T>[];
  active: T;
  onChange: (id: T) => void;
}

export default function SectionTabs<T extends string>({
  sections,
  active,
  onChange,
}: SectionTabsProps<T>) {
  const activeSection = sections.find((section) => section.id === active);

  // Setas esquerda/direita percorrem as abas, como no padrão WAI-ARIA de tabs.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    const index = sections.findIndex((section) => section.id === active);
    const next = sections[(index + step + sections.length) % sections.length];
    if (next) {
      onChange(next.id);
      document.getElementById(`tab-${next.id}`)?.focus();
    }
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Seções dos gráficos analíticos"
        onKeyDown={handleKeyDown}
        className="flex flex-wrap gap-1 border-b border-stroke dark:border-strokedark"
      >
        {sections.map((section) => {
          const selected = section.id === active;
          return (
            <button
              key={section.id}
              id={`tab-${section.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${section.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(section.id)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                selected
                  ? 'border-primary text-primary'
                  : 'border-transparent text-body hover:text-black dark:text-bodydark dark:hover:text-white'
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>
      {activeSection && (
        <p className="mt-3 text-sm text-body dark:text-bodydark">{activeSection.description}</p>
      )}
    </div>
  );
}

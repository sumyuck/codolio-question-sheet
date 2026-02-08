import { Download, Import, Search } from 'lucide-react';

interface HeaderBarProps {
  search: string;
  onSearch: (value: string) => void;
  onExport: () => void;
  onImport: () => void;
}

export default function HeaderBar({ search, onSearch, onExport, onImport }: HeaderBarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm uppercase tracking-widest text-codolio-muted">Question Tracker</p>
        <h1 className="text-2xl font-semibold">Strivers A2Z DSA Sheet</h1>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-codolio-muted" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search questions"
            className="w-full rounded-lg border border-codolio-border bg-codolio-panelLight py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-codolio-accent"
          />
        </div>
        <button className="icon-button" onClick={onExport} title="Export JSON">
          <Download className="h-4 w-4" />
        </button>
        <button className="icon-button" onClick={onImport} title="Import JSON">
          <Import className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

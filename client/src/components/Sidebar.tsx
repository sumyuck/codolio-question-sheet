import {
  BarChart2,
  BookOpen,
  FileText,
  HelpCircle,
  Home,
  LayoutGrid,
  NotebookPen,
  Star,
  Trophy
} from 'lucide-react';

const navItems = [
  { label: 'Home', icon: Home },
  { label: 'Portfolio', icon: LayoutGrid },
  { label: 'Explore Sheets', icon: BarChart2, active: true },
  { label: 'My Sheets', icon: FileText },
  { label: 'Notes', icon: NotebookPen }
];

const secondaryItems = [
  { label: 'Contests', icon: Trophy },
  { label: 'Leaderboard', icon: Star },
  { label: 'Help Center', icon: HelpCircle }
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-codolio-border bg-codolio-panel px-4 py-6">
      <div className="mb-8 flex items-center gap-3 text-lg font-semibold">
        <BookOpen className="h-6 w-6 text-codolio-accent" />
        <span>Codolio</span>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                item.active
                  ? 'bg-codolio-panelLight text-codolio-accent'
                  : 'text-codolio-muted hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="my-6 border-t border-codolio-border" />
      <nav className="space-y-1 text-sm">
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-codolio-muted hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto space-y-2 pt-6 text-sm text-codolio-muted">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:text-white">
          Edit Profile
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-red-400 hover:text-red-300">
          Log Out
        </button>
      </div>
    </aside>
  );
}

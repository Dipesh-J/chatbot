import { MessageSquare, FileText, BarChart2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const TABS = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
];

export function ContentTabs({ activeTab, onTabChange }) {
    return (
        <div className="shrink-0 flex items-center justify-center pt-3 pb-3 px-4 bg-zinc-950/80 backdrop-blur-sm border-b border-border/30">
            <div className="flex items-center gap-1 bg-zinc-900/80 border border-border/60 rounded-full p-1">
                {TABS.map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onTabChange(id)}
                            className={cn(
                                'relative flex items-center gap-1.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out select-none',
                                isActive
                                    ? 'bg-zinc-700/80 text-foreground shadow-sm px-4 py-1.5'
                                    : 'text-muted-foreground hover:text-foreground/80 px-3 py-1.5'
                            )}
                            style={{
                                // Smooth width transition via padding/content changes
                                transition: 'background 0.25s ease, color 0.25s ease, padding 0.25s ease',
                            }}
                        >
                            {/* Icon: always rendered but only visible when active */}
                            <span
                                className={cn(
                                    'flex items-center overflow-hidden transition-all duration-300',
                                    isActive ? 'w-4 opacity-100' : 'w-0 opacity-0'
                                )}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                            </span>
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

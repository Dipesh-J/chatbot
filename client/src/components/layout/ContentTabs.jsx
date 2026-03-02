import { MessageSquare, FileText, BarChart2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const TABS = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
];

export function ContentTabs({ activeTab, onTabChange }) {
    return (
        <div className="shrink-0 border-b border-border bg-zinc-950/80 backdrop-blur-sm px-4">
            <div className="flex items-center gap-1 max-w-3xl mx-auto">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className={cn(
                            'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg',
                            activeTab === id
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground/80'
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                        {/* Active indicator */}
                        {activeTab === id && (
                            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

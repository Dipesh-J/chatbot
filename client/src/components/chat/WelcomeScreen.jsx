import { BarChart2, TrendingUp, FileText, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SUGGESTIONS = [
    { icon: TrendingUp, label: 'What is my total revenue?', color: 'text-green-400' },
    { icon: BarChart2, label: 'Show monthly expenses as a bar chart', color: 'text-blue-400' },
    { icon: MessageSquarePlus, label: 'Create a 90-day growth plan', color: 'text-purple-400' },
    { icon: FileText, label: 'Generate a monthly summary report', color: 'text-orange-400' },
];

export function WelcomeScreen({ onSuggestionClick }) {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] || 'there';

    return (
        <div className="flex flex-col items-center justify-center h-full px-6 pb-16 animate-fade-in-up">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-lg shadow-primary/5">
                <BarChart2 className="w-8 h-8 text-primary" />
            </div>

            {/* Greeting */}
            <h1 className="text-2xl font-semibold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Hello, {firstName} 👋
            </h1>
            <p className="text-muted-foreground text-center max-w-md mb-10">
                I'm BizCopilot, your AI-powered business intelligence assistant. Upload your financial data and let's uncover insights together.
            </p>

            {/* Suggestion cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTIONS.map(({ icon: Icon, label, color }) => (
                    <button
                        key={label}
                        onClick={() => onSuggestionClick(label)}
                        className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200 text-left"
                    >
                        <div className={`mt-0.5 p-1.5 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 transition-colors ${color}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                            {label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

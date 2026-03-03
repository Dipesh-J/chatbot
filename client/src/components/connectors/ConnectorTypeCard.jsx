import { cn } from '../../lib/utils';

export function ConnectorTypeCard({ name, icon: Icon, description, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex flex-col items-start gap-2 p-4 bg-zinc-900/40 border border-border/50 rounded-xl text-left transition-all',
                disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:border-primary/30 hover:bg-zinc-900/60 cursor-pointer'
            )}
        >
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-5 h-5 text-primary" />}
                <span className="text-sm font-medium text-foreground">{name}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            {disabled && (
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Coming soon</span>
            )}
        </button>
    );
}

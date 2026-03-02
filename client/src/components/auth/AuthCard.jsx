import { BarChart2 } from 'lucide-react';

export function AuthCard({ children, title, subtitle }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            {/* Background gradient orb */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="flex items-center gap-3 justify-center mb-8">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <BarChart2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xl font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        BizCopilot
                    </span>
                </div>

                {/* Card */}
                <div className="glass rounded-2xl p-8 border border-border shadow-2xl">
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-semibold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            {title}
                        </h1>
                        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

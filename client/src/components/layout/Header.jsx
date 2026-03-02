import { BarChart2, Upload } from 'lucide-react';
import { Button } from '../ui/button';

export function Header({ onOpenCSVUpload }) {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-zinc-950/80 backdrop-blur-sm shrink-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <BarChart2 className="w-4 h-4 text-primary" />
        </div>
        <span className="font-heading font-semibold text-base text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          BizCopilot
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={onOpenCSVUpload}
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Data</span>
        </Button>
      </div>
    </header>
  );
}

import { BarChart2, FileText, Upload, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { getInitials } from '../../lib/utils';

export function Header({ onOpenReports, onOpenCSVUpload }) {
  const { user, logout } = useAuth();

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
          onClick={onOpenReports}
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Reports</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={onOpenCSVUpload}
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Data</span>
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-xs">{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground hidden sm:block max-w-[120px] truncate">{user?.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={logout}>
              <LogOut className="w-4 h-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

import { Plus, MessageSquare, Trash2, ChevronLeft, Settings, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ReportsDrawer from '../reports/ReportsDrawer';
import SettingsModal from './SettingsModal';
import { useState } from 'react';
import clsx from 'clsx';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Separator } from '../ui/separator';

export default function Sidebar({ open, onToggle, sessions, activeSession, onNewChat, onSelectSession, onDeleteSession, isMobile }) {
  const { user, logout } = useAuth();
  const [showReports, setShowReports] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <TooltipProvider>
      <>
        <div
          className={clsx(
            'z-50 bg-surface/40 backdrop-blur-xl border-r border-white/5 transform transition-all duration-300 ease-in-out flex flex-col',
            isMobile
              ? clsx('fixed inset-y-0 left-0 w-64', open ? 'translate-x-0' : '-translate-x-full')
              : clsx('relative translate-x-0', open ? 'w-64' : 'w-0 overflow-hidden')
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h1 className="font-bold text-lg tracking-wide">BizCopilot</h1>
            <Button variant="ghost" size="icon-sm" onClick={onToggle} className="text-gray-400 hover:text-white">
              <ChevronLeft size={18} />
            </Button>
          </div>

          {/* Actions */}
          <div className="p-3 space-y-1">
            <Button
              variant="outline"
              onClick={onNewChat}
              className="w-full justify-center gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Plus size={16} />
              New Chat
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowReports(true)}
              className="w-full justify-start gap-2 text-gray-400 hover:text-white"
            >
              <FileText size={16} />
              Reports
            </Button>
          </div>

          <Separator className="bg-white/5" />

          {/* Session list */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session._id}
                className={clsx(
                  'w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors truncate flex items-center gap-2 group cursor-pointer',
                  session.id === activeSession?.id
                    ? 'bg-white/10 text-white shadow-sm border border-white/5'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                )}
                onClick={() => onSelectSession(session)}
              >
                <MessageSquare size={14} className="flex-shrink-0" />
                <span className="truncate flex-1">{session.title}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session._id);
                  }}
                  className={clsx(
                    'text-gray-400 hover:text-red-400 p-0 h-auto w-auto',
                    session.id === activeSession?.id
                      ? 'opacity-50 sm:opacity-0 sm:group-hover:opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  )}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>

          {/* Footer — user info + settings */}
          <div className="p-4 border-t border-white/5 mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar size="default">
                  {user?.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                  <AvatarFallback className="bg-white/10 text-white text-sm font-medium">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white truncate max-w-[120px]">{user?.name || 'User'}</span>
                  <span className="text-xs text-gray-500">Power User</span>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowSettings(true)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Settings size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {showReports && <ReportsDrawer onClose={() => setShowReports(false)} />}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onLogout={logout} />}
      </>
    </TooltipProvider>
  );
}

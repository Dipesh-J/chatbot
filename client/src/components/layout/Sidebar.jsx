import { MessageSquarePlus, Trash2, MessageSquare, MoreHorizontal, LogOut, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn, truncate, formatDate, getInitials } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ sessions, activeSession, onNewChat, onSelectSession, onDeleteSession }) {
    const { user, logout } = useAuth();

    return (
        <aside className="w-64 shrink-0 flex flex-col bg-zinc-950 border-r border-border h-full">
            {/* New Chat button */}
            <div className="p-3">
                <Button
                    onClick={onNewChat}
                    className="w-full gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 transition-all"
                    variant="ghost"
                >
                    <MessageSquarePlus className="w-4 h-4" />
                    New Chat
                </Button>
            </div>

            {/* Session list */}
            <ScrollArea className="flex-1 px-2">
                {sessions.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                        <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No chats yet</p>
                        <p className="text-xs text-muted-foreground/60">Start a new conversation</p>
                    </div>
                ) : (
                    <div className="space-y-0.5 pb-4">
                        {sessions.map((session) => {
                            const isActive = activeSession?._id === session._id;
                            return (
                                <div
                                    key={session._id}
                                    className={cn(
                                        'group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150',
                                        isActive
                                            ? 'bg-accent text-foreground'
                                            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                                    )}
                                    onClick={() => onSelectSession(session)}
                                >
                                    <MessageSquare className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-primary' : '')} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate leading-snug">
                                            {session.title || 'New Chat'}
                                        </p>
                                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                                            {formatDate(session.createdAt)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteSession(session._id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all duration-150 rounded"
                                        title="Delete chat"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>

            {/* Profile footer */}
            <div className="p-3 border-t border-border">
                <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="text-xs bg-zinc-800">{getInitials(user?.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate leading-snug">{user?.name}</p>
                        <p className="text-xs text-muted-foreground/60 truncate">{user?.email}</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="end" className="w-48">
                            <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                                {user?.email}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Settings className="w-4 h-4" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={logout}
                            >
                                <LogOut className="w-4 h-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </aside>
    );
}

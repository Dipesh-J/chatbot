import { MessageSquarePlus, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { cn, truncate, formatDate } from '../../lib/utils';

export function Sidebar({ sessions, activeSession, onNewChat, onSelectSession, onDeleteSession }) {
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

            {/* Footer */}
            <div className="p-3 border-t border-border">
                <p className="text-xs text-muted-foreground/40 text-center">BizCopilot v1.0</p>
            </div>
        </aside>
    );
}

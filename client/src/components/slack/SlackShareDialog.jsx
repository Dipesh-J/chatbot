import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Search, Hash, Lock, Loader2, User, Users } from 'lucide-react';
import { getSlackChannels, getSlackUsers } from '../../api/composio';
import toast from 'react-hot-toast';

export function SlackShareDialog({ open, onOpenChange, onConfirm, isSharing, title = 'Share to Slack' }) {
    const [targetType, setTargetType] = useState('channel'); // 'channel' or 'dm'
    const [channels, setChannels] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChannelId, setSelectedChannelId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');

    useEffect(() => {
        if (open) {
            fetchData();
        } else {
            resetState();
        }
    }, [open, targetType]);

    const resetState = () => {
        setSearchQuery('');
        setSelectedChannelId('');
        setSelectedUserId('');
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (targetType === 'channel') {
                const response = await getSlackChannels();
                setChannels(response.data.channels || []);
            } else {
                const response = await getSlackUsers();
                setUsers(response.data.users || []);
            }
        } catch (error) {
            console.error(`Failed to fetch Slack ${targetType}:`, error);
            toast.error(`Failed to load Slack ${targetType === 'channel' ? 'channels' : 'users'}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredChannels = channels.filter(channel =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = users.filter(user => {
        const searchLower = searchQuery.toLowerCase();
        return (
            user.name?.toLowerCase().includes(searchLower) ||
            user.real_name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower)
        );
    });

    const handleConfirm = () => {
        if (targetType === 'channel' && selectedChannelId) {
            onConfirm({ type: 'channel', target: selectedChannelId });
        } else if (targetType === 'dm' && selectedUserId) {
            onConfirm({ type: 'dm', target: selectedUserId });
        }
    };

    const isValidSelection = targetType === 'channel' ? !!selectedChannelId : !!selectedUserId;

    return (
        <Dialog open={open} onOpenChange={isSharing ? undefined : onOpenChange}>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Select a channel or person to share this content.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col space-y-4 py-2">
                    {/* Target Type Toggle */}
                    <div className="flex bg-zinc-900 rounded-md p-1">
                        <button
                            type="button"
                            onClick={() => { setTargetType('channel'); resetState(); }}
                            disabled={isSharing}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                                targetType === 'channel'
                                    ? 'bg-zinc-800 text-white'
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <Hash className="w-4 h-4" />
                            Channel
                        </button>
                        <button
                            type="button"
                            disabled={true}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors text-zinc-600 cursor-not-allowed"
                            title="Coming soon"
                        >
                            <User className="w-4 h-4" />
                            Direct Message
                            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">Soon</span>
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder={targetType === 'channel' ? 'Search channels...' : 'Search users...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-zinc-900 border-zinc-800"
                        />
                    </div>

                    {/* List */}
                    <div className="border border-zinc-800 rounded-md overflow-hidden bg-zinc-900/50">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                <span className="text-sm">Loading...</span>
                            </div>
                        ) : (
                            <ScrollArea className="h-[240px]">
                                <div className="p-2 space-y-1">
                                    {targetType === 'channel' ? (
                                        filteredChannels.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                                <Hash className="w-8 h-8 mb-2 opacity-50" />
                                                <span className="text-sm">No channels found</span>
                                            </div>
                                        ) : (
                                            filteredChannels.map((channel) => (
                                                <button
                                                    key={channel.id}
                                                    onClick={() => setSelectedChannelId(channel.id)}
                                                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                                        selectedChannelId === channel.id
                                                            ? 'bg-primary text-primary-foreground font-medium'
                                                            : 'hover:bg-zinc-800 text-zinc-300'
                                                    }`}
                                                >
                                                    {channel.is_private ? (
                                                        <Lock className="w-4 h-4 mr-2" />
                                                    ) : (
                                                        <Hash className="w-4 h-4 mr-2" />
                                                    )}
                                                    <span className="truncate">{channel.name}</span>
                                                </button>
                                            ))
                                        )
                                    ) : (
                                        filteredUsers.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                                <Users className="w-8 h-8 mb-2 opacity-50" />
                                                <span className="text-sm">No users found</span>
                                            </div>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => setSelectedUserId(user.id)}
                                                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                                        selectedUserId === user.id
                                                            ? 'bg-primary text-primary-foreground font-medium'
                                                            : 'hover:bg-zinc-800 text-zinc-300'
                                                    }`}
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center mr-2">
                                                        <User className="w-3 h-3" />
                                                    </div>
                                                    <div className="flex flex-col items-start truncate">
                                                        <span className="truncate">{user.real_name || user.name}</span>
                                                        {user.email && (
                                                            <span className="text-xs text-zinc-500 truncate">{user.email}</span>
                                                        )}
                                                    </div>
                                                </button>
                                            ))
                                        )
                                    )}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>

                <DialogFooter className="sm:justify-end gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isSharing}
                        className="hover:bg-zinc-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!isValidSelection || isSharing}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[100px]"
                    >
                        {isSharing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sharing
                            </>
                        ) : (
                            'Share'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

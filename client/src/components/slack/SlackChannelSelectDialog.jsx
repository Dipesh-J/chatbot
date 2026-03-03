import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Search, Hash, Lock, Loader2 } from 'lucide-react';
import { getSlackChannels } from '../../api/composio';
import toast from 'react-hot-toast';

export function SlackChannelSelectDialog({ open, onOpenChange, onConfirm, isSharing }) {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChannelId, setSelectedChannelId] = useState('');

    useEffect(() => {
        if (open) {
            fetchChannels();
        } else {
            // Reset state when closed
            setSearchQuery('');
            setSelectedChannelId('');
        }
    }, [open]);

    const fetchChannels = async () => {
        setLoading(true);
        try {
            const response = await getSlackChannels();
            setChannels(response.data.channels || []);
        } catch (error) {
            console.error('Failed to fetch Slack channels:', error);
            toast.error('Failed to load Slack channels');
        } finally {
            setLoading(false);
        }
    };

    const filteredChannels = channels.filter(channel =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleConfirm = () => {
        if (selectedChannelId) {
            onConfirm(selectedChannelId);
        }
    };

    return (
        <Dialog open={open} onOpenChange={isSharing ? undefined : onOpenChange}>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Share to Slack</DialogTitle>
                    <DialogDescription>
                        Select a channel to share this content.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col space-y-4 py-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search channels..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-zinc-900 border-zinc-800"
                        />
                    </div>

                    <div className="border border-zinc-800 rounded-md overflow-hidden bg-zinc-900/50">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                <span className="text-sm">Loading channels...</span>
                            </div>
                        ) : filteredChannels.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <Hash className="w-8 h-8 mb-2 opacity-50" />
                                <span className="text-sm">No channels found</span>
                            </div>
                        ) : (
                            <ScrollArea className="h-[240px]">
                                <div className="p-2 space-y-1">
                                    {filteredChannels.map((channel) => (
                                        <button
                                            key={channel.id}
                                            onClick={() => setSelectedChannelId(channel.id)}
                                            className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${selectedChannelId === channel.id
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
                                    ))}
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
                        disabled={!selectedChannelId || isSharing}
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

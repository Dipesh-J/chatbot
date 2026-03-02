import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { MessageList } from '../components/chat/MessageList';
import { ChatInput } from '../components/chat/ChatInput';
import { ReportsPanel } from '../components/reports/ReportsPanel';
import { DashboardTab } from '../components/dashboard/DashboardTab';
import { useChat } from '../hooks/useChat';
import { useCSVUpload } from '../hooks/useCSVUpload';
import { Loader2 } from 'lucide-react';

export function ChatPage() {
    const chatProps = useChat();
    const csvState = useCSVUpload();
    const [csvOpen, setCsvOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('chat');

    const {
        sessions,
        activeSession,
        messages,
        isStreaming,
        toolCalls,
        loadSessions,
        startNewSession,
        selectSession,
        sendMessage,
        removeSession,
    } = chatProps;

    // Load sessions and open the most recent one on mount
    useEffect(() => {
        const init = async () => {
            const loaded = await loadSessions();
            if (loaded.length > 0) {
                await selectSession(loaded[0]);
            } else {
                await startNewSession();
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSend = (content) => sendMessage(content);
    const handleSuggestion = (s) => sendMessage(s);

    if (!activeSession && sessions.length === 0) {
        return (
            <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <AppLayout
            chatProps={{ sessions, activeSession, startNewSession, selectSession, removeSession }}
            csvProps={{ ...csvState, csvOpen, setCsvOpen }}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            {/* Tab content with slide transition */}
            <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden relative">
                {/* Chat tab */}
                <div
                    className="absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out"
                    style={{ transform: activeTab === 'chat' ? 'translateX(0)' : 'translateX(-100%)' }}
                >
                    <MessageList
                        messages={messages}
                        isStreaming={isStreaming}
                        toolCalls={toolCalls}
                        onSuggestionClick={handleSuggestion}
                    />
                    <ChatInput
                        onSend={handleSend}
                        isStreaming={isStreaming}
                        hasMessages={messages.length > 0}
                        onUploadClick={() => setCsvOpen(true)}
                    />
                </div>

                {/* Reports tab */}
                <div
                    className="absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out"
                    style={{ transform: activeTab === 'reports' ? 'translateX(0)' : activeTab === 'chat' ? 'translateX(100%)' : 'translateX(-100%)' }}
                >
                    {activeTab === 'reports' && <ReportsPanel />}
                </div>

                {/* Dashboard tab */}
                <div
                    className="absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out"
                    style={{ transform: activeTab === 'dashboard' ? 'translateX(0)' : 'translateX(100%)' }}
                >
                    {activeTab === 'dashboard' && <DashboardTab />}
                </div>
            </div>
        </AppLayout>
    );
}

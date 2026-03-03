import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { MessageList } from '../components/chat/MessageList';
import { ChatInput } from '../components/chat/ChatInput';
import { ReportsPanel } from '../components/reports/ReportsPanel';
import { DashboardTab } from '../components/dashboard/DashboardTab';
import { ConnectorsPanel } from '../components/connectors/ConnectorsPanel';
import { SettingsDialog } from '../components/settings/SettingsDialog';
import { useChat } from '../hooks/useChat';
import { useCSVUpload } from '../hooks/useCSVUpload';
import { useConnectors } from '../hooks/useConnectors';
import { Loader2 } from 'lucide-react';

export function ChatPage() {
    const chatProps = useChat();
    const csvState = useCSVUpload();
    const [csvOpen, setCsvOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('chat');
    const [settingsOpen, setSettingsOpen] = useState(false);

    const { connectors, mcpTools, actions } = useConnectors();

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

    const handleSend = (content, outputMode) => sendMessage(content, outputMode);
    const handleSuggestion = (s) => sendMessage(s);
    const handleConnectorsClick = () => setActiveTab('connectors');

    if (!activeSession && sessions.length === 0) {
        return (
            <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <>
            <AppLayout
                chatProps={{ sessions, activeSession, startNewSession, selectSession, removeSession }}
                csvProps={{ ...csvState, csvOpen, setCsvOpen }}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onConnectorsClick={handleConnectorsClick}
                onSettingsClick={() => setSettingsOpen(true)}
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
                            onFileUpload={csvState.upload}
                            sessionId={activeSession?._id}
                            mcpTools={mcpTools}
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

                    {/* Connectors panel — slides in from the right */}
                    <div
                        className="absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out"
                        style={{ transform: activeTab === 'connectors' ? 'translateX(0)' : 'translateX(100%)' }}
                    >
                        {activeTab === 'connectors' && (
                            <ConnectorsPanel
                                connectors={connectors}
                                mcpTools={mcpTools}
                                actions={actions}
                            />
                        )}
                    </div>
                </div>
            </AppLayout>

            <SettingsDialog
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </>
    );
}


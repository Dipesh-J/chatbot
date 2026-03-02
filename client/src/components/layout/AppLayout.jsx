import { Sidebar } from './Sidebar';
import { ContentTabs } from './ContentTabs';
import { UploadModal } from '../csv/UploadModal';

export function AppLayout({ children, chatProps, csvProps, activeTab, onTabChange }) {
    const { sessions, activeSession, startNewSession, selectSession, removeSession } = chatProps;
    const { csvOpen, setCsvOpen } = csvProps;

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-1 min-h-0">
                <Sidebar
                    sessions={sessions}
                    activeSession={activeSession}
                    onNewChat={startNewSession}
                    onSelectSession={(session) => {
                        selectSession(session);
                        onTabChange('chat');
                    }}
                    onDeleteSession={removeSession}
                />
                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                    <ContentTabs activeTab={activeTab} onTabChange={onTabChange} />
                    <main className="flex-1 flex min-w-0 min-h-0">
                        {children}
                    </main>
                </div>
            </div>

            <UploadModal
                open={csvOpen}
                onClose={() => setCsvOpen(false)}
                csvProps={csvProps}
                sessionId={activeSession?._id}
            />
        </div>
    );
}

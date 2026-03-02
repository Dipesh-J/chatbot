import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ReportsDrawer } from '../reports/ReportsDrawer';
import { UploadModal } from '../csv/UploadModal';
import { useState } from 'react';

export function AppLayout({ children, chatProps, csvProps }) {
    const { sessions, activeSession, startNewSession, selectSession, removeSession } = chatProps;
    const { csvOpen, setCsvOpen } = csvProps;
    const [reportsOpen, setReportsOpen] = useState(false);

    return (
        <div className="flex flex-col h-full">
            <Header
                onOpenReports={() => setReportsOpen(true)}
                onOpenCSVUpload={() => setCsvOpen(true)}
            />
            <div className="flex flex-1 min-h-0">
                <Sidebar
                    sessions={sessions}
                    activeSession={activeSession}
                    onNewChat={startNewSession}
                    onSelectSession={selectSession}
                    onDeleteSession={removeSession}
                />
                <main className="flex-1 flex min-w-0 min-h-0">
                    {children}
                </main>
            </div>

            <ReportsDrawer open={reportsOpen} onClose={() => setReportsOpen(false)} />
            <UploadModal
                open={csvOpen}
                onClose={() => setCsvOpen(false)}
                csvProps={csvProps}
            />
        </div>
    );
}

import { useEffect, useState, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { useCSVUpload } from '../hooks/useCSVUpload';
import { useDashboard } from '../context/DashboardContext';
import clsx from 'clsx';
import AppLayout from '../components/layout/AppLayout';
import ChatPanel from '../components/chat/ChatPanel';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import CSVUploadModal from '../components/csv/CSVUploadModal';
import KPICards from '../components/dashboard/KPICards';
import DataSourceList from '../components/csv/DataSourceList';
import { PanelRightOpen, PanelRightClose, Share2 } from 'lucide-react';

export default function DashboardPage() {
  const {
    sessions,
    activeSession,
    messages,
    isStreaming,
    toolCalls,
    loadSessions,
    createSession,
    selectSession,
    sendMessage,
    removeSession,
  } = useChat();

  const { datasets, loadDatasets, removeDataset } = useCSVUpload();
  const { joinSession, clearCharts } = useDashboard();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const previousDatasetsLength = useRef(0);

  useEffect(() => {
    loadSessions();
    loadDatasets();
  }, []);

  useEffect(() => {
    if (activeSession) {
      joinSession(activeSession._id);
    }
  }, [activeSession?._id]);

  const latestSummary = datasets[0]?.summary;

  return (
    <AppLayout
      sessions={sessions}
      activeSession={activeSession}
      onNewChat={() => { createSession(); clearCharts(); }}
      onSelectSession={selectSession}
      onDeleteSession={removeSession}
      onDataUploaded={loadDatasets}
    >
      <div className="h-full flex relative bg-transparent">
        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-w-0 h-full w-full absolute inset-0">
          <ChatPanel
            messages={messages}
            isStreaming={isStreaming}
            toolCalls={toolCalls}
            onSend={sendMessage}
            onUploadRequest={() => setShowUploadModal(true)}
          />
        </div>

        {/* Upload Modal rendered here instead of Header */}
        {showUploadModal && <CSVUploadModal onClose={() => { setShowUploadModal(false); loadDatasets(); }} />}
      </div>
    </AppLayout>
  );
}

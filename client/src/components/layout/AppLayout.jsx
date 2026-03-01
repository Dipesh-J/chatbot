import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

export default function AppLayout({ children, sessions, activeSession, onNewChat, onSelectSession, onDeleteSession, onDataUploaded }) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [activeSession?._id]);

  return (
    <div className="h-screen flex overflow-hidden bg-transparent">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        sessions={sessions}
        activeSession={activeSession}
        onNewChat={onNewChat}
        onSelectSession={onSelectSession}
        onDeleteSession={onDeleteSession}
        isMobile={isMobile}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isMobile={isMobile} onDataUploaded={onDataUploaded} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

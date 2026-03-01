import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CSVUploadModal from '../csv/CSVUploadModal';
import ReportsDrawer from '../reports/ReportsDrawer';
import SettingsModal from './SettingsModal';
import { Button } from '../ui/button';

export default function Header({ onToggleSidebar, isMobile, onDataUploaded }) {
  const { user, logout } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="h-16 bg-surface/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sticky top-0 z-40 w-full">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleSidebar}
            className="text-gray-400 hover:text-white"
          >
            <Menu size={20} />
          </Button>
          <span className="text-sm font-medium text-gray-300">BizCopilot AI</span>
        </div>
      </header>

      {showUpload && <CSVUploadModal onClose={() => { setShowUpload(false); if (onDataUploaded) onDataUploaded(); }} />}
      {showReports && <ReportsDrawer onClose={() => setShowReports(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}

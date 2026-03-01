import { useRef } from 'react';
import { FileSpreadsheet, X } from 'lucide-react';

export default function UploadPopover({ onClose, onFileSelected }) {
    const fileInputRef = useRef(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelected(file);
            onClose();
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Popover */}
            <div className="absolute bottom-full left-0 mb-2 z-50 w-52 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-2 backdrop-blur-xl">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Attach</span>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors">
                        <X size={13} />
                    </button>
                </div>

                <button
                    onClick={handleClick}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group text-left"
                >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                        <FileSpreadsheet size={16} className="text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">Upload CSV</p>
                        <p className="text-xs text-gray-500">Spreadsheet data</p>
                    </div>
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleChange}
                />
            </div>
        </>
    );
}

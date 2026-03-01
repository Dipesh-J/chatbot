import { useState } from 'react';
import { Share2, BarChart3, CheckCircle, Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ChartRenderer from '../dashboard/ChartRenderer';

export default function ChartBubble({ chart }) {
    const [shared, setShared] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const handleShare = () => {
        // TODO: wire to real Slack API
        setShared(true);
        toast.success("Shared to Slack!");
        setTimeout(() => setShared(false), 3000);
    };

    return (
        <div className="my-2 max-w-[90%]">
            <div className="bg-surface/60 backdrop-blur-xl border border-white/8 rounded-2xl overflow-hidden shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={14} className="text-gray-400" />
                        <span className="text-sm font-medium text-white">{chart.title || 'Analysis Chart'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                        >
                            {shared ? <CheckCircle size={11} /> : <Share2 size={11} />}
                            {shared ? 'Shared!' : 'Share to Slack'}
                        </button>
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <Maximize2 size={13} />
                        </button>
                    </div>
                </div>

                {/* Chart */}
                <div className={`p-4 transition-all duration-300 ${expanded ? 'h-96' : 'h-56'}`}>
                    <ChartRenderer type={chart.type} config={chart.config} />
                </div>
            </div>
        </div>
    );
}

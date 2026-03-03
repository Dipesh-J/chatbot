import { useEffect, useState } from 'react';
import { FileText, Share2, Trash2, ExternalLink, Slack, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { getReports, getReport, shareToSlack, deleteReport } from '../../api/reports';
import { formatDate } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

export function ReportsDrawer({ open, onClose }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [sharing, setSharing] = useState(false);

    useEffect(() => {
        if (!open) { setSelectedReport(null); return; }
        setLoading(true);
        getReports()
            .then((res) => setReports(res.data.reports || []))
            .catch(() => toast.error('Failed to load reports'))
            .finally(() => setLoading(false));
    }, [open]);

    const openReport = async (report) => {
        setLoadingReport(true);
        try {
            const res = await getReport(report._id);
            setSelectedReport(res.data.report);
        } catch { toast.error('Failed to load report'); }
        finally { setLoadingReport(false); }
    };

    const handleShare = async () => {
        if (!selectedReport) return;
        setSharing(true);
        try {
            await shareToSlack(selectedReport._id);
            toast.success('Report shared to Slack!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to share to Slack');
        } finally { setSharing(false); }
    };

    const handleDelete = async (reportId) => {
        try {
            await deleteReport(reportId);
            setReports((prev) => prev.filter((r) => r._id !== reportId));
            if (selectedReport?._id === reportId) setSelectedReport(null);
            toast.success('Report deleted');
        } catch { toast.error('Failed to delete report'); }
    };

    const TYPE_COLORS = { summary: 'default', strategy: 'warning', analysis: 'secondary' };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {selectedReport ? (
                            <button onClick={() => setSelectedReport(null)} className="p-1 rounded hover:bg-accent transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        ) : <FileText className="w-5 h-5 text-primary" />}
                        {selectedReport ? selectedReport.title : 'Reports'}
                    </DialogTitle>
                </DialogHeader>

                {/* Report list */}
                {!selectedReport && (
                    <ScrollArea className="flex-1">
                        {loading ? (
                            <div className="py-12 text-center text-muted-foreground text-sm">Loading reports...</div>
                        ) : reports.length === 0 ? (
                            <div className="py-12 text-center">
                                <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">No reports yet</p>
                                <p className="text-xs text-muted-foreground/60">Ask BizCopilot to "generate a report"</p>
                            </div>
                        ) : (
                            <div className="space-y-2 pb-2">
                                {reports.map((report) => (
                                    <div
                                        key={report._id}
                                        className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer group"
                                        onClick={() => openReport(report)}
                                    >
                                        <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="text-sm font-medium text-foreground truncate">{report.title}</p>
                                                {report.sharedToSlack && <Slack className="w-3.5 h-3.5 text-[#4A154B] shrink-0" />}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{formatDate(report.createdAt)}</span>
                                                <Badge variant={TYPE_COLORS[report.type] || 'secondary'} className="text-xs capitalize">{report.type}</Badge>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(report._id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-zinc-700 text-muted-foreground hover:text-red-400 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                )}

                {/* Report viewer */}
                {selectedReport && (
                    <>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground -mt-1 mb-2">
                            <span>{formatDate(selectedReport.createdAt)}</span>
                            <span>·</span>
                            <Badge variant={TYPE_COLORS[selectedReport.type] || 'secondary'} className="capitalize">{selectedReport.type}</Badge>

                        </div>
                        <ScrollArea className="flex-1 border border-border rounded-xl px-5 py-4">
                            {loadingReport ? (
                                <p className="text-muted-foreground text-sm">Loading...</p>
                            ) : (
                                <div className="prose text-sm">
                                    <ReactMarkdown>{selectedReport.content}</ReactMarkdown>
                                </div>
                            )}
                        </ScrollArea>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleShare}
                                disabled={sharing}
                                className="gap-2"
                            >
                                <Slack className="w-4 h-4" />
                                {sharing ? 'Sharing...' : 'Share to Slack'}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

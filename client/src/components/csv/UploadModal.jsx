import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, X, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { cn, formatDate } from '../../lib/utils';

export function UploadModal({ open, onClose, csvProps }) {
    const { datasets, uploading, uploadResult, loadDatasets, upload, removeDataset, setUploadResult } = csvProps;

    useEffect(() => {
        if (open) loadDatasets();
    }, [open, loadDatasets]);

    const onDrop = useCallback(
        async (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (!file) return;
            await upload(file);
        },
        [upload]
    );

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
        disabled: uploading,
    });

    const handleClose = () => {
        setUploadResult(null);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-primary" />
                        Upload Financial Data
                    </DialogTitle>
                </DialogHeader>

                {/* Drop Zone */}
                <div
                    {...getRootProps()}
                    className={cn(
                        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
                        isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-zinc-600 hover:bg-zinc-900/40',
                        uploading && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    <input {...getInputProps()} />
                    <Upload className={cn('w-10 h-10 mx-auto mb-3 transition-colors', isDragActive ? 'text-primary' : 'text-muted-foreground/50')} />
                    {uploading ? (
                        <p className="text-sm text-muted-foreground">Uploading and processing...</p>
                    ) : isDragActive ? (
                        <p className="text-sm text-primary font-medium">Drop your CSV here</p>
                    ) : (
                        <>
                            <p className="text-sm font-medium text-foreground mb-1">Drag & drop a CSV file, or click to browse</p>
                            <p className="text-xs text-muted-foreground">CSV only · Max 10MB · 10,000 rows</p>
                        </>
                    )}
                </div>

                {/* File rejections */}
                {fileRejections.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-red-400 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {fileRejections[0].errors[0]?.message || 'Invalid file'}
                    </div>
                )}

                {/* Upload result preview */}
                {uploadResult && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Upload successful!</span>
                        </div>
                        <p className="text-sm text-foreground font-medium">{uploadResult.fileName}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{uploadResult.rowCount?.toLocaleString()} rows</span>
                            <span>·</span>
                            <span>{uploadResult.columns?.length} columns</span>
                        </div>
                        {uploadResult.summary && (
                            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                                <div className="bg-zinc-900/60 rounded-lg p-2 text-center">
                                    <p className="text-muted-foreground mb-0.5">Revenue</p>
                                    <p className="text-green-400 font-semibold">${uploadResult.summary.totalRevenue?.toLocaleString()}</p>
                                </div>
                                <div className="bg-zinc-900/60 rounded-lg p-2 text-center">
                                    <p className="text-muted-foreground mb-0.5">Expenses</p>
                                    <p className="text-red-400 font-semibold">${uploadResult.summary.totalExpenses?.toLocaleString()}</p>
                                </div>
                                <div className="bg-zinc-900/60 rounded-lg p-2 text-center">
                                    <p className="text-muted-foreground mb-0.5">Profit</p>
                                    <p className="text-blue-400 font-semibold">${uploadResult.summary.netProfit?.toLocaleString()}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Existing datasets */}
                {datasets.length > 0 && (
                    <div>
                        <p className="text-xs text-muted-foreground font-medium mb-2">Your datasets</p>
                        <ScrollArea className="max-h-48">
                            <div className="space-y-2">
                                {datasets.map((ds) => (
                                    <div key={ds._id} className="flex items-center gap-3 bg-zinc-900/40 rounded-lg px-3 py-2.5 border border-border/50">
                                        <FileSpreadsheet className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-foreground truncate">{ds.fileName}</p>
                                            <p className="text-xs text-muted-foreground">{ds.rowCount?.toLocaleString()} rows · {formatDate(ds.createdAt)}</p>
                                        </div>
                                        <Badge variant={ds.status === 'ready' ? 'success' : 'warning'} className="text-xs shrink-0">
                                            {ds.status}
                                        </Badge>
                                        <button
                                            onClick={() => removeDataset(ds._id)}
                                            className="p-1 rounded hover:bg-zinc-700 text-muted-foreground hover:text-red-400 transition-all shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

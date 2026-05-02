import React, { useRef, useState } from 'react';
import { Paperclip, X, FileText, Image as ImageIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}

export function AttachmentGrid({ attachments = [], editable = false, onChange, compact = false, testIdPrefix = 'attachment' }) {
    const inputRef = useRef(null);
    const [lightbox, setLightbox] = useState(null);

    const addFiles = async (files) => {
        const list = Array.from(files || []);
        const newItems = [];
        for (const f of list) {
            if (f.size > 8 * 1024 * 1024) {
                alert(`${f.name} is larger than 8MB — please upload a smaller file.`);
                continue;
            }
            const dataUrl = await fileToDataUrl(f);
            newItems.push({ filename: f.name, mime: f.type, size: f.size, data_base64: dataUrl });
        }
        onChange && onChange([...(attachments || []), ...newItems]);
    };

    const removeAt = (idx) => {
        onChange && onChange(attachments.filter((_, i) => i !== idx));
    };

    const isImage = (a) => (a.mime || '').startsWith('image/');

    return (
        <div className="space-y-3">
            {editable && (
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        hidden
                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                        onChange={(e) => addFiles(e.target.files)}
                        data-testid={`${testIdPrefix}-upload-input`}
                    />
                    <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} data-testid={`${testIdPrefix}-upload-button`}>
                        <Paperclip className="h-4 w-4 mr-2" /> Add files
                    </Button>
                    <span className="text-xs text-muted-foreground">Images & documents up to 8MB each</span>
                </div>
            )}
            {attachments && attachments.length > 0 && (
                <div className={compact ? 'grid grid-cols-3 sm:grid-cols-4 gap-2' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'}>
                    {attachments.map((a, idx) => (
                        <div key={idx} className="group relative">
                            {isImage(a) ? (
                                <button
                                    type="button"
                                    className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted"
                                    onClick={() => setLightbox(a)}
                                    data-testid={`${testIdPrefix}-image-tile-${idx}`}
                                >
                                    <img src={a.data_base64} alt={a.filename} className="h-full w-full object-cover" />
                                </button>
                            ) : (
                                <a
                                    className="flex items-center gap-2 rounded-xl border bg-card p-3 hover:bg-muted/50 transition-colors"
                                    href={a.data_base64}
                                    download={a.filename}
                                    data-testid={`${testIdPrefix}-doc-tile-${idx}`}
                                >
                                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                                    <span className="truncate text-xs">{a.filename}</span>
                                    <Download className="ml-auto h-4 w-4 text-muted-foreground" />
                                </a>
                            )}
                            {editable && (
                                <button
                                    type="button"
                                    className="absolute top-1 right-1 rounded-full bg-background/90 p-1 border shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    onClick={() => removeAt(idx)}
                                    aria-label="Remove"
                                    data-testid={`${testIdPrefix}-remove-button-${idx}`}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
                <DialogContent className="max-w-3xl bg-background">
                    {lightbox && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                <span className="text-sm font-medium truncate">{lightbox.filename}</span>
                            </div>
                            <img src={lightbox.data_base64} alt={lightbox.filename} className="mx-auto max-h-[75vh] object-contain" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AttachmentGrid;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AttachmentGrid } from '@/components/AttachmentGrid';
import { initials, relativeTime } from '@/lib/utils-crm';
import { Plus, Send, Paperclip, Store, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const POLL_MS = 4000;

export default function Messages() {
    const { user } = useAuth();
    const [threads, setThreads] = useState([]);
    const [currentId, setCurrentId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [q, setQ] = useState('');
    const [text, setText] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [users, setUsers] = useState([]);
    const [dealers, setDealers] = useState([]);
    const [open, setOpen] = useState(false);
    const [newThread, setNewThread] = useState({ participant_ids: [], dealer_id: '', topic: '' });
    const [mobileShowChat, setMobileShowChat] = useState(false);
    const scrollRef = useRef(null);

    const current = threads.find((t) => t.thread_id === currentId);

    const loadThreads = async () => {
        try {
            const { data } = await api.get('/messaging/threads');
            setThreads(data);
            if (!currentId && data.length > 0) setCurrentId(data[0].thread_id);
        } catch { /* noop */ }
    };
    const loadMessages = async () => {
        if (!currentId) return;
        try {
            const { data } = await api.get(`/messaging/threads/${currentId}/messages`);
            setMessages(data);
            setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
        } catch { /* noop */ }
    };
    useEffect(() => { loadThreads(); }, []);
    useEffect(() => { if (currentId) { loadMessages(); setMobileShowChat(true); } }, [currentId]);

    useEffect(() => {
        const id = setInterval(() => {
            loadThreads();
            loadMessages();
        }, POLL_MS);
        return () => clearInterval(id);
        // eslint-disable-next-line
    }, [currentId]);

    useEffect(() => {
        api.get('/users').then(({ data }) => setUsers(data)).catch(() => {});
        api.get('/dealers').then(({ data }) => setDealers(data)).catch(() => {});
    }, []);

    const filtered = useMemo(() => {
        if (!q) return threads;
        const needle = q.toLowerCase();
        return threads.filter((t) => {
            const names = (t.participants || []).map((p) => p.name || '').join(' ');
            return (t.name || '').toLowerCase().includes(needle) || names.toLowerCase().includes(needle) || (t.last_message || '').toLowerCase().includes(needle);
        });
    }, [q, threads]);

    const send = async (e) => {
        e && e.preventDefault();
        if (!currentId) return;
        if (!text && attachments.length === 0) return;
        try {
            await api.post('/messaging/messages', { thread_id: currentId, text, attachments });
            setText('');
            setAttachments([]);
            loadMessages();
            loadThreads();
        } catch (e) { toast.error(e?.response?.data?.detail || 'Failed to send'); }
    };

    const createThread = async (e) => {
        e.preventDefault();
        if (newThread.participant_ids.length === 0) return;
        try {
            const { data } = await api.post('/messaging/threads', newThread);
            setOpen(false);
            setNewThread({ participant_ids: [], dealer_id: '', topic: '' });
            await loadThreads();
            setCurrentId(data.thread_id);
            toast.success('Conversation ready');
        } catch (e) { toast.error(e?.response?.data?.detail || 'Failed'); }
    };

    const threadLabel = (t) => {
        const others = (t.participants || []).filter((p) => p.user_id !== user?.user_id);
        return t.name || others.map((p) => p.name).filter(Boolean).join(', ') || 'Conversation';
    };

    const dealerName = (id) => dealers.find((d) => d.dealer_id === id)?.firm_name;

    return (
        <div className="space-y-3 h-[calc(100vh-8rem)]" data-testid="messages-page">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Messages</h1>
                    <p className="text-xs text-muted-foreground">WhatsApp-style threads with your team and dealers. Updates every {POLL_MS / 1000}s.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button data-testid="thread-create-button"><Plus className="h-4 w-4 mr-2" /> New conversation</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Start a new conversation</DialogTitle></DialogHeader>
                        <form className="space-y-3" onSubmit={createThread}>
                            <div>
                                <Label className="text-xs">Participants</Label>
                                <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border bg-card p-2 space-y-1">
                                    {users.filter((u) => u.user_id !== user?.user_id).map((u) => (
                                        <label key={u.user_id} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={newThread.participant_ids.includes(u.user_id)}
                                                onCheckedChange={(v) => setNewThread((n) => ({ ...n, participant_ids: v ? [...n.participant_ids, u.user_id] : n.participant_ids.filter((x) => x !== u.user_id) }))}
                                                data-testid={`thread-participant-${u.user_id}`}
                                            />
                                            <span>{u.name} · <span className="text-muted-foreground capitalize">{(u.role || '').replace('_', ' ')}</span></span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs">Topic (optional)</Label>
                                <Input value={newThread.topic} onChange={(e) => setNewThread({ ...newThread, topic: e.target.value })} placeholder="e.g. Stock indent for Aug" data-testid="thread-topic-input" />
                            </div>
                            <div>
                                <Label className="text-xs">Related dealer (optional)</Label>
                                <Select value={newThread.dealer_id} onValueChange={(v) => setNewThread({ ...newThread, dealer_id: v })}>
                                    <SelectTrigger data-testid="thread-dealer-select"><SelectValue placeholder="— None —" /></SelectTrigger>
                                    <SelectContent>
                                        {dealers.map((d) => <SelectItem key={d.dealer_id} value={d.dealer_id}>{d.firm_name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button type="submit" data-testid="thread-save-button">Create</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="rounded-2xl p-0 overflow-hidden h-[calc(100%-3.5rem)] grid md:grid-cols-[320px_1fr]">
                {/* Thread list */}
                <aside className={`border-r flex flex-col ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-3 border-b">
                        <div className="relative">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations" className="pl-9 h-9 rounded-xl" data-testid="messages-thread-search-input" />
                        </div>
                    </div>
                    <ScrollArea className="flex-1 thin-scroll">
                        <div className="p-2 space-y-1">
                            {filtered.length === 0 && <div className="text-sm text-muted-foreground text-center p-6">No conversations yet.</div>}
                            {filtered.map((t) => {
                                const label = threadLabel(t);
                                const active = t.thread_id === currentId;
                                return (
                                    <button key={t.thread_id} onClick={() => setCurrentId(t.thread_id)} className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${active ? 'bg-secondary' : 'hover:bg-muted/50'}`} data-testid={`messages-thread-row-${t.thread_id}`}>
                                        <Avatar className="h-9 w-9 shrink-0"><AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials(label)}</AvatarFallback></Avatar>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-sm font-medium truncate">{label}</span>
                                                <span className="text-[11px] text-muted-foreground shrink-0">{relativeTime(t.last_message_at)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-muted-foreground truncate">{t.last_message || '—'}</span>
                                            </div>
                                            {(t.dealer_id || t.topic) && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {t.dealer_id && <span className="text-[10px] rounded-full bg-accent px-2 py-0.5 text-accent-foreground inline-flex items-center gap-1"><Store className="h-3 w-3" />{dealerName(t.dealer_id) || 'Dealer'}</span>}
                                                    {t.topic && <span className="text-[10px] rounded-full bg-secondary px-2 py-0.5">{t.topic}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </aside>

                {/* Chat pane */}
                <section className={`flex flex-col min-w-0 ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
                    {current ? (
                        <>
                            <header className="h-14 border-b px-4 flex items-center gap-3">
                                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileShowChat(false)} aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button>
                                <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials(threadLabel(current))}</AvatarFallback></Avatar>
                                <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{threadLabel(current)}</div>
                                    <div className="text-[11px] text-muted-foreground">{(current.participants || []).length} participants</div>
                                </div>
                                {current.dealer_id && (
                                    <Badge variant="outline" className="ml-auto font-normal"><Store className="h-3 w-3 mr-1" /> {dealerName(current.dealer_id) || 'Dealer'}</Badge>
                                )}
                            </header>
                            <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scroll p-4 space-y-2" data-testid="messages-list">
                                {messages.length === 0 && <div className="text-sm text-muted-foreground text-center py-10">No messages yet. Say hello!</div>}
                                {messages.map((m) => {
                                    const mine = m.author_id === user?.user_id;
                                    return (
                                        <div key={m.message_id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`} data-testid={`message-${m.message_id}`}>
                                            <div className={`max-w-[82%] rounded-2xl px-3 py-2 ${mine ? 'bg-primary text-primary-foreground bubble-out' : 'bg-muted text-foreground bubble-in'}`}>
                                                {!mine && <div className="text-[10px] font-medium opacity-70 mb-0.5">{m.author_name}</div>}
                                                {m.text && <div className="text-sm whitespace-pre-wrap">{m.text}</div>}
                                                {m.attachments?.length > 0 && (
                                                    <div className="mt-2">
                                                        <AttachmentGrid attachments={m.attachments} compact />
                                                    </div>
                                                )}
                                                <div className={`mt-1 text-[10px] ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{relativeTime(m.created_at)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <form onSubmit={send} className="sticky bottom-0 bg-background/80 backdrop-blur border-t p-3 space-y-2">
                                {attachments.length > 0 && <AttachmentGrid attachments={attachments} editable onChange={setAttachments} testIdPrefix="messages-attach" compact />}
                                <div className="flex items-end gap-2">
                                    <label className="inline-flex items-center rounded-xl border bg-card px-2 h-10 cursor-pointer" data-testid="messages-attach-button">
                                        <Paperclip className="h-4 w-4" />
                                        <input type="file" multiple hidden onChange={async (e) => {
                                            const files = Array.from(e.target.files || []);
                                            const out = [];
                                            for (const f of files) {
                                                if (f.size > 8 * 1024 * 1024) { alert(`${f.name} too large (max 8MB)`); continue; }
                                                const r = new FileReader();
                                                const p = new Promise((res, rej) => { r.onload = () => res(r.result); r.onerror = rej; });
                                                r.readAsDataURL(f);
                                                const data = await p;
                                                out.push({ filename: f.name, mime: f.type, size: f.size, data_base64: data });
                                            }
                                            setAttachments((a) => [...a, ...out]);
                                            e.target.value = '';
                                        }} />
                                    </label>
                                    <Textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
                                        placeholder="Write a message…"
                                        className="min-h-10 max-h-36 rounded-xl resize-none"
                                        rows={1}
                                        data-testid="messages-composer-input"
                                    />
                                    <Button type="submit" className="rounded-xl h-10 px-4" data-testid="messages-send-button"><Send className="h-4 w-4 mr-1" /> Send</Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 grid place-items-center text-sm text-muted-foreground" data-testid="messages-empty">
                            Select a conversation or start a new one.
                        </div>
                    )}
                </section>
            </Card>
        </div>
    );
}

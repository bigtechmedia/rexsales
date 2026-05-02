import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Logo } from '@/components/Logo';
import { toast } from 'sonner';

export default function AuthCallback() {
    const navigate = useNavigate();
    const { googleSession } = useAuth();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const hash = window.location.hash || '';
        const match = hash.match(/session_id=([^&]+)/);
        const sessionId = match ? decodeURIComponent(match[1]) : null;
        if (!sessionId) {
            navigate('/login', { replace: true });
            return;
        }
        (async () => {
            try {
                await googleSession(sessionId);
                toast.success('Signed in with Google');
                // Remove fragment
                window.history.replaceState(null, '', window.location.pathname);
                navigate('/dashboard', { replace: true });
            } catch (e) {
                const msg = e?.response?.data?.detail || 'Google sign-in failed';
                toast.error(msg);
                navigate('/login', { replace: true });
            }
        })();
    }, [navigate, googleSession]);

    return (
        <div className="min-h-screen grid place-items-center bg-background">
            <div className="flex flex-col items-center gap-3">
                <Logo />
                <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <div className="text-sm text-muted-foreground">Completing sign-in…</div>
            </div>
        </div>
    );
}

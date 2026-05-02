import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Logo } from '@/components/Logo';
import { toast } from 'sonner';
import { Mail, Lock, ShieldCheck, Sprout } from 'lucide-react';

const SEED_ACCOUNTS = [
    { label: 'Owner', email: 'owner@rexbotanix.com' },
    { label: 'Admin', email: 'admin@rexbotanix.com' },
    { label: 'Manager', email: 'manager@rexbotanix.com' },
    { label: 'Sales Rep', email: 'rep@rexbotanix.com' },
    { label: 'Dealer', email: 'dealer@rexbotanix.com' },
];

export default function Login() {
    const { user, login } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('admin@rexbotanix.com');
    const [password, setPassword] = useState('Passw0rd!');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (user) return <Navigate to="/dashboard" replace />;

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email.trim(), password);
            toast.success('Signed in');
            const dest = location.state?.from?.pathname || '/dashboard';
            navigate(dest, { replace: true });
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Login failed';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const onGoogle = () => {
        // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
        const redirectUrl = window.location.origin + '/dashboard';
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden grid lg:grid-cols-2">
            {/* Left side — brand panel */}
            <div className="relative hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-primary/5 via-transparent to-[hsl(var(--accent)/0.4)]">
                <div className="relative z-10"><Logo className="scale-110 origin-left" /></div>
                <div className="relative z-10 max-w-md space-y-5">
                    <h1 className="font-display text-4xl font-semibold tracking-tight leading-[1.1]">
                        Sales reporting for the <span className="text-primary">fields you grow</span>.
                    </h1>
                    <p className="text-muted-foreground">
                        Onboard dealers, submit farm & dealer visits, track approvals, and message your team — all from one refined CRM built for Rex Botanix.
                    </p>
                    <ul className="space-y-2 text-sm text-foreground/80">
                        <li className="flex items-center gap-2"><Sprout className="h-4 w-4 text-primary" /> Mobile-first field reports with photo & document uploads</li>
                        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Expense / leave / travel approvals workflow</li>
                        <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> WhatsApp-style messaging with CRM context</li>
                    </ul>
                </div>
                <div className="relative z-10 text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Rex Botanix. An internal sales & field-ops platform.
                </div>
                <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
                    <div className="absolute -top-24 -left-24 h-[480px] w-[480px] rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-[hsl(var(--chart-3)/0.16)] blur-3xl" />
                </div>
            </div>

            {/* Right side — form */}
            <div className="flex items-center justify-center p-6 md:p-10">
                <Card className="w-full max-w-md rounded-2xl p-6 md:p-8 shadow-sm" data-testid="login-card">
                    <div className="lg:hidden mb-6"><Logo /></div>
                    <h2 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Sign in to your Rex Botanix account to continue.</p>

                    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" required data-testid="login-email-input" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" required data-testid="login-password-input" />
                        </div>
                        {error && (
                            <Alert variant="destructive" data-testid="login-error-alert"><AlertDescription>{error}</AlertDescription></Alert>
                        )}
                        <Button type="submit" className="w-full h-11 rounded-xl" disabled={loading} data-testid="login-submit-button">
                            {loading ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </form>

                    <div className="my-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
                        <div className="h-px flex-1 bg-border" />
                    </div>

                    <Button type="button" variant="outline" className="w-full h-11 rounded-xl" onClick={onGoogle} data-testid="login-google-button">
                        <GoogleIcon className="h-4 w-4 mr-2" /> Sign in with Google
                    </Button>

                    <div className="mt-6 rounded-xl bg-secondary/60 p-4">
                        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Demo accounts — password: Passw0rd!</div>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {SEED_ACCOUNTS.map((a) => (
                                <button
                                    key={a.email}
                                    type="button"
                                    className="rounded-lg border bg-card px-2 py-1.5 text-left text-xs hover:border-primary hover:bg-background transition-colors"
                                    onClick={() => { setEmail(a.email); setPassword('Passw0rd!'); }}
                                    data-testid={`login-demo-${a.label.toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                    <div className="font-medium">{a.label}</div>
                                    <div className="text-muted-foreground truncate">{a.email}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function GoogleIcon({ className }) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.7 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.8-8 19.8-20 0-1.3-.1-2.3-.2-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.4 16 18.8 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.1 29.3 4 24 4 16.1 4 9.3 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5.2l-6.3-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.2 39.6 16 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.2C41.8 35.5 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z" />
        </svg>
    );
}

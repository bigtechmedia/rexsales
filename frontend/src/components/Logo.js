import React from 'react';

export function Logo({ className = '' }) {
    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            <svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true" className="text-primary">
                <defs>
                    <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--chart-4))" />
                    </linearGradient>
                </defs>
                <path
                    d="M20 34c-8 0-14-6-14-14 0-8 6-14 14-14 1.5 0 2.8.2 4.1.6-0.9 7.2-6.5 13.8-13.8 15C11.2 29.6 15.2 34 20 34Zm8-28c1.2 1.3 2 3 2 5 0 6-6 11-13 12 1-7 6-13 11-17Z"
                    fill="url(#leafGrad)"
                />
            </svg>
            <span className="font-display font-semibold tracking-tight text-lg">
                Rex <span className="text-primary">Botanix</span>
            </span>
        </div>
    );
}

export default Logo;

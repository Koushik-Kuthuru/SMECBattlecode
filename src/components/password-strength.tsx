
'use client';

import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface PasswordStrengthProps {
    password?: string;
}

export function PasswordStrength({ password = '' }: PasswordStrengthProps) {
    const [strength, setStrength] = useState({
        level: 'none',
        text: '',
    });

    useEffect(() => {
        let score = 0;
        if (!password) {
            setStrength({ level: 'none', text: '' });
            return;
        }

        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) {
            setStrength({ level: 'weak', text: 'Weak' });
        } else if (score <= 4) {
            setStrength({ level: 'medium', text: 'Medium' });
        } else {
            setStrength({ level: 'strong', text: 'Strong' });
        }
    }, [password]);

    const strengthLevel = strength.level;

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-3 gap-1 h-1.5">
                <div className={cn("rounded-full", {
                    'bg-destructive': strengthLevel === 'weak',
                    'bg-yellow-500': strengthLevel === 'medium',
                    'bg-green-500': strengthLevel === 'strong',
                    'bg-muted': strengthLevel === 'none',
                })}></div>
                <div className={cn("rounded-full", {
                    'bg-yellow-500': strengthLevel === 'medium',
                    'bg-green-500': strengthLevel === 'strong',
                    'bg-muted': strengthLevel !== 'medium' && strengthLevel !== 'strong',
                })}></div>
                 <div className={cn("rounded-full", {
                    'bg-green-500': strengthLevel === 'strong',
                    'bg-muted': strengthLevel !== 'strong',
                })}></div>
            </div>
            <p className="text-xs font-medium"
                style={{
                    color: strengthLevel === 'weak' ? 'hsl(var(--destructive))' :
                           strengthLevel === 'medium' ? '#f59e0b' : // yellow-500
                           strengthLevel === 'strong' ? '#22c55e' : // green-500
                           'inherit'
                }}
            >
                {strength.text}
            </p>
        </div>
    );
}


'use client';

import { ServerHealthMonitor } from '@/components/admin/server-health-monitor';

export default function ServerHealthPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="space-y-8">
                <ServerHealthMonitor />
            </div>
        </div>
    )
}

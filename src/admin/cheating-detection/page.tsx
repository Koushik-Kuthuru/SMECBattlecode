
'use client';

import { CheatingDetection as CheatingDetectionComponent } from '@/components/admin/cheating-detection';

export default function CheatingDetectionPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="space-y-8">
                <CheatingDetectionComponent />
            </div>
        </div>
    )
}

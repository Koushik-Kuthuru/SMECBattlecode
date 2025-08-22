
'use client';

import {
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
} from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
    page: number;
    totalPages: number;
    setPage: (page: number) => void;
    className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
    page,
    totalPages,
    setPage,
    className,
}) => {
    const MAX_VISIBLE_PAGES = 5;

    const generatePageNumbers = () => {
        if (totalPages <= MAX_VISIBLE_PAGES + 2) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | '...')[] = [];
        const startPages = [1, 2];
        const endPages = [totalPages - 1, totalPages];
        
        const currentPageIsNearStart = page <= MAX_VISIBLE_PAGES - 2;
        const currentPageIsNearEnd = page >= totalPages - (MAX_VISIBLE_PAGES - 3);

        pages.push(1);

        if (currentPageIsNearStart) {
            for (let i = 2; i < MAX_VISIBLE_PAGES; i++) {
                pages.push(i);
            }
            pages.push('...');
            pages.push(totalPages);
        } else if (currentPageIsNearEnd) {
            pages.push('...');
            for (let i = totalPages - (MAX_VISIBLE_PAGES - 2); i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
             pages.push('...');
             pages.push(page - 1);
             pages.push(page);
             pages.push(page + 1);
             pages.push('...');
             pages.push(totalPages);
        }

        return Array.from(new Set(pages)); // Remove duplicates
    };

    const pages = generatePageNumbers();

    if (totalPages <= 1) return null;

    return (
        <div className={cn('flex justify-center items-center space-x-2 mt-4', className)}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="h-8 w-8"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            {pages.map((p, index) =>
                p === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 py-1">
                        <MoreHorizontal className="h-4 w-4" />
                    </span>
                ) : (
                    <Button
                        key={p}
                        variant={page === p ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setPage(p as number)}
                        className="h-8 w-8"
                    >
                        {p}
                    </Button>
                )
            )}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                 className="h-8 w-8"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
};

export { Pagination };


'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Eye } from 'lucide-react';

// Placeholder data for demonstration
const suspiciousActivities = [
  {
    challenge: 'Two Sum',
    users: ['Alice', 'Bob'],
    similarity: 98,
    timestamp: '2024-05-20 10:30:15',
  },
  {
    challenge: 'Reverse Linked List',
    users: ['Charlie', 'David'],
    similarity: 95,
    timestamp: '2024-05-20 09:45:22',
  },
  {
    challenge: 'FizzBuzz',
    users: ['Eve', 'Frank'],
    similarity: 100,
    timestamp: '2024-05-19 18:12:45',
  },
    {
    challenge: 'Container With Most Water',
    users: ['Grace', 'Heidi'],
    similarity: 92,
    timestamp: '2024-05-19 15:20:00',
  },
];

export function CheatingDetection() {
  const getSimilarityColor = (similarity: number) => {
    if (similarity > 95) return 'text-red-600';
    if (similarity > 90) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            <CardTitle>Cheating Detection</CardTitle>
        </div>
        <CardDescription>Potentially suspicious submissions based on code similarity.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Challenge</TableHead>
                <TableHead>Users Involved</TableHead>
                <TableHead>Similarity</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suspiciousActivities.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{activity.challenge}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {activity.users.map(user => <Badge key={user} variant="secondary">{user}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getSimilarityColor(activity.similarity)}>
                      {activity.similarity}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{activity.timestamp}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

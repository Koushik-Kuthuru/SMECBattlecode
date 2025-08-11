
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Eye, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { useState } from 'react';
import { CodeEditor } from '../code-editor';

// Placeholder data for demonstration
const suspiciousActivities = [
  {
    challenge: 'Two Sum',
    users: ['Alice', 'Bob'],
    similarity: 98,
    timestamp: '2024-05-20 10:30:15',
    code: {
        Alice: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        num_map = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in num_map:
                return [num_map[complement], i]
            num_map[num] = i`,
        Bob: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        num_map = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in num_map:
                return [num_map[complement], i]
            num_map[num] = i`,
    },
    language: 'python'
  },
  {
    challenge: 'Reverse Linked List',
    users: ['Charlie', 'David'],
    similarity: 95,
    timestamp: '2024-05-20 09:45:22',
    code: {
        Charlie: `var reverseList = function(head) {
    let prev = null;
    let curr = head;
    while (curr) {
        let nextTemp = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
};`,
        David: `var reverseList = function(head) {
    let prev = null;
    let curr = head;
    while (curr != null) {
        let nextTemp = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
};`
    },
    language: 'javascript'
  },
  {
    challenge: 'FizzBuzz',
    users: ['Eve', 'Frank'],
    similarity: 100,
    timestamp: '2024-05-19 18:12:45',
     code: {
        Eve: `vector<string> fizzBuzz(int n) {
    vector<string> res;
    for(int i = 1; i <= n; i++){
        if(i % 15 == 0) res.push_back("FizzBuzz");
        else if(i % 3 == 0) res.push_back("Fizz");
        else if(i % 5 == 0) res.push_back("Buzz");
        else res.push_back(to_string(i));
    }
    return res;
}`,
        Frank: `vector<string> fizzBuzz(int n) {
    vector<string> res;
    for(int i = 1; i <= n; i++){
        if(i % 15 == 0) res.push_back("FizzBuzz");
        else if(i % 3 == 0) res.push_back("Fizz");
        else if(i % 5 == 0) res.push_back("Buzz");
        else res.push_back(to_string(i));
    }
    return res;
}`
    },
    language: 'c++'
  },
];

type SuspiciousActivity = (typeof suspiciousActivities)[0];

export function CheatingDetection() {
  const [selectedActivity, setSelectedActivity] = useState<SuspiciousActivity | null>(null);

  const getSimilarityColor = (similarity: number) => {
    if (similarity > 95) return 'text-red-600';
    if (similarity > 90) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <>
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
                    <Button variant="outline" size="sm" onClick={() => setSelectedActivity(activity)}>
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

    <Dialog open={!!selectedActivity} onOpenChange={(isOpen) => !isOpen && setSelectedActivity(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Review Suspicious Activity</DialogTitle>
                <DialogDescription>
                    Challenge: {selectedActivity?.challenge} | Similarity: <span className={getSimilarityColor(selectedActivity?.similarity || 0)}>{selectedActivity?.similarity}%</span>
                </DialogDescription>
            </DialogHeader>
            
            {selectedActivity && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                    {Object.entries(selectedActivity.code).map(([user, code]) => (
                        <div key={user} className="flex flex-col">
                            <h3 className="font-semibold mb-2 text-center">{user}'s Submission</h3>
                            <div className="relative flex-1 rounded-md border">
                                <CodeEditor 
                                    value={code} 
                                    onChange={() => {}} 
                                    language={selectedActivity.language}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
             <DialogClose asChild>
                <Button variant="outline" className="mt-4" onClick={() => setSelectedActivity(null)}>
                    Close
                </Button>
             </DialogClose>
        </DialogContent>
    </Dialog>
    </>
  );
}

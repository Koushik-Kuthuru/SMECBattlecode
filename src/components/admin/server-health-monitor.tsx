
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Server, MemoryStick, Cpu } from 'lucide-react';

const cpuData = [
  { time: '10:00', usage: 20 },
  { time: '10:05', usage: 25 },
  { time: '10:10', usage: 22 },
  { time: '10:15', usage: 30 },
  { time: '10:20', usage: 28 },
  { time: '10:25', usage: 35 },
  { time: '10:30', usage: 32 },
];

const memoryData = [
  { time: '10:00', usage: 55 },
  { time: '10:05', usage: 58 },
  { time: '10:10', usage: 62 },
  { time: '10:15', usage: 60 },
  { time: '10:20', usage: 65 },
  { time: '10:25', usage: 68 },
  { time: '10:30', usage: 70 },
];

const requestLogs = [
    { time: '10:30:15', method: 'GET', path: '/api/challenges', status: 200, duration: '45ms' },
    { time: '10:30:12', method: 'POST', path: '/api/submit/two-sum', status: 201, duration: '128ms' },
    { time: '10:29:58', method: 'GET', path: '/api/users/leaderboard', status: 200, duration: '88ms' },
    { time: '10:29:45', method: 'GET', path: '/api/advertisements', status: 200, duration: '32ms' },
    { time: '10:29:30', method: 'POST', path: '/api/login', status: 401, duration: '76ms' },
];

export function ServerHealthMonitor() {
    
  const getStatusColor = (status: number) => {
    if (status >= 500) return 'bg-red-500';
    if (status >= 400) return 'bg-yellow-500';
    if (status >= 300) return 'bg-blue-500';
    return 'bg-green-500';
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Server className="h-6 w-6" />
            <CardTitle>Server Health Monitor</CardTitle>
        </div>
        <CardDescription>Real-time CPU usage, memory consumption, and request logs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
            <div>
                 <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Cpu className="h-5 w-5" />
                    CPU Usage (%)
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={cpuData}>
                        <defs>
                            <linearGradient id="cpuColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" fontSize={12} />
                        <YAxis fontSize={12} unit="%" />
                        <Tooltip />
                        <Area type="monotone" dataKey="usage" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#cpuColor)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
             <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <MemoryStick className="h-5 w-5" />
                    Memory Usage (%)
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={memoryData}>
                         <defs>
                            <linearGradient id="memoryColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" fontSize={12} />
                        <YAxis fontSize={12} unit="%" />
                        <Tooltip />
                        <Area type="monotone" dataKey="usage" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#memoryColor)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-4">Recent Request Logs</h3>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Path</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Duration</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requestLogs.map((log, index) => (
                             <TableRow key={index}>
                                <TableCell className="font-mono text-xs">{log.time}</TableCell>
                                <TableCell>
                                    <Badge variant={log.method === 'GET' ? 'secondary' : 'default'} className="text-xs">
                                        {log.method}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{log.path}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className={`h-2.5 w-2.5 rounded-full ${getStatusColor(log.status)}`} />
                                        <span>{log.status}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">{log.duration}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

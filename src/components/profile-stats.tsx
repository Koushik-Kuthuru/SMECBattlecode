
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Label } from 'recharts';

type DifficultyStats = {
  Easy: number;
  Medium: number;
  Hard: number;
};

interface ProfileStatsProps {
  solvedCount: number;
  attemptedCount: number;
  totalChallenges: number;
  totalChallengesByDifficulty: DifficultyStats;
  solvedByDifficulty: DifficultyStats;
}

const COLORS = {
  solved: 'hsl(var(--primary))',
  attempted: 'hsl(var(--accent-foreground))',
  unsolved: 'hsl(var(--muted))',
};

const difficultyColors: Record<keyof DifficultyStats, string> = {
    Easy: 'text-green-500',
    Medium: 'text-yellow-500',
    Hard: 'text-red-500'
}

export function ProfileStats({ 
    solvedCount, 
    attemptedCount, 
    totalChallenges,
    totalChallengesByDifficulty,
    solvedByDifficulty 
}: ProfileStatsProps) {

  const chartData = [
    { name: 'Solved', value: solvedCount },
    { name: 'Attempted', value: attemptedCount },
    { name: 'Unsolved', value: Math.max(0, totalChallenges - solvedCount - attemptedCount) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Problems Solved</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="relative h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  innerRadius="70%"
                  outerRadius="100%"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold">{solvedCount}<span className="text-xl text-muted-foreground">/{totalChallenges}</span></span>
                <span className="text-sm text-green-500 font-semibold mt-1">✓ Solved</span>
            </div>
          </div>
          <div className="space-y-3">
             <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                <div className={`${difficultyColors.Easy} font-semibold`}>Easy</div>
                <div className="font-bold">{solvedByDifficulty.Easy}<span className="text-muted-foreground">/{totalChallengesByDifficulty.Easy}</span></div>
             </div>
             <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                <div className={`${difficultyColors.Medium} font-semibold`}>Medium</div>
                <div className="font-bold">{solvedByDifficulty.Medium}<span className="text-muted-foreground">/{totalChallengesByDifficulty.Medium}</span></div>
             </div>
             <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                <div className={`${difficultyColors.Hard} font-semibold`}>Hard</div>
                <div className="font-bold">{solvedByDifficulty.Hard}<span className="text-muted-foreground">/{totalChallengesByDifficulty.Hard}</span></div>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

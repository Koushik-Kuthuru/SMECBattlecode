
import { SmecBattleCodeLogo } from './icons';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4">
          <SmecBattleCodeLogo className="h-16 w-16 text-primary" />
          <h1 className="text-2xl font-bold">SMEC Admin Panel</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

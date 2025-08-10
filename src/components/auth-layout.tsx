import { SmecBattleCodeLogo } from './icons';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-100 via-sky-50 to-blue-200 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4">
            <SmecBattleCodeLogo className="h-20 w-20 text-primary" />
             <h1 className="text-3xl font-bold text-slate-800">Welcome to SMEC Battle Code</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

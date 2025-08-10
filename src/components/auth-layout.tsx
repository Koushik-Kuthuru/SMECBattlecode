
import { SmecBattleCodeLogo } from './icons';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <SmecBattleCodeLogo className="h-16 w-16 text-primary" />
        </div>
        {children}
      </div>
    </div>
  );
}

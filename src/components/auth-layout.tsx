

import { SmecBattleCodeLogo } from './icons';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}

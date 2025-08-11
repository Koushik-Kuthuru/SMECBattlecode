

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}

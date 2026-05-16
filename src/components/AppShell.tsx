import type { ReactNode } from 'react';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-[#ede4d1] px-5 py-5 text-[#17211c]">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1500px] flex-col border border-[#17211c] bg-[#f7f1e5] shadow-[8px_8px_0_#17211c]">
        {children}
      </div>
    </main>
  );
}

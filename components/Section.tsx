import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
};

export default function Section({ children }: SectionProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 sm:px-10 lg:px-16">
      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        {children}
      </div>
    </main>
  );
}

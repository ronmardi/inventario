import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function GlassCard({ children, className = "", title }: GlassCardProps) {
  return (
    <div
      className={`p-6 sm:p-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] transition-all ${className}`}
    >
      {title && (
        <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/50 dark:border-gray-700/50 pb-3 mb-6">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
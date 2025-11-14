"use client";

interface HeaderProps {
  className?: string;
}

export default function Header({ className = "" }: HeaderProps) {
  return (
    <header
      className={`bg-white dark:bg-[var(--card-background)] border-b border-gray-200 dark:border-[var(--card-border)] fixed top-0 left-0 right-0 z-50 ${className}`}
    >
      <div className="max-w-md mx-auto px-4 pt-2 pb-3">
        <div className="flex items-center justify-center">
          {/* Logo Image */}
          <img
            src="/logo.png"
            alt="Game Companion Logo"
            className="h-12 w-auto"
          />
        </div>
      </div>
    </header>
  );
}

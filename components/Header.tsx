'use client';

interface HeaderProps {
  className?: string;
}

export default function Header({ 
  className = ""
}: HeaderProps) {
  return (
    <header className={`bg-white border-b border-gray-200 sticky top-0 z-40 ${className}`}>
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

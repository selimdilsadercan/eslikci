'use client';

interface HeaderProps {
  className?: string;
}

export default function Header({ 
  className = ""
}: HeaderProps) {
  return (
    <header className={`backdrop-blur-[9px] bg-[rgba(255,255,255,0.8)] border-b border-[rgba(0,0,0,0.1)] sticky top-0 z-40 ${className}`} style={{ boxShadow: '0 0 8px 5px #297dff0a' }}>
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

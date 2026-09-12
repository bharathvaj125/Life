import React from 'react';

export const CyberButton = React.forwardRef(function CyberButton({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}, ref) {
  const base =
    'relative inline-flex items-center justify-center font-telemetry uppercase tracking-wider font-semibold transition-all duration-200 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 outline-none focus:ring-2';

  const sizes = {
    sm: 'text-xs px-3 py-1.5 cyber-cut-sm gap-1.5',
    md: 'text-sm px-4 py-2 cyber-cut-sm gap-2',
    lg: 'text-base px-6 py-3 cyber-cut gap-2.5',
  };

  const variants = {
    primary:
      'bg-[#00F0FF] text-[#07090E] hover:bg-[#38E1FF] active:bg-[#00D0DF] focus:ring-[#00F0FF]/50 shadow-[0_0_15px_rgba(0,240,255,0.35)]',
    secondary:
      'bg-[#131B2E] text-[#00F0FF] border border-[#00F0FF]/40 hover:bg-[#00F0FF]/10 hover:border-[#00F0FF] active:bg-[#00F0FF]/20 focus:ring-[#00F0FF]/40',
    danger:
      'bg-[#FF0055] text-white hover:bg-[#FF2E74] active:bg-[#D90048] focus:ring-[#FF0055]/50 shadow-[0_0_15px_rgba(255,0,85,0.35)]',
    amber:
      'bg-[#FFB800] text-[#07090E] hover:bg-[#FFC72E] active:bg-[#E5A500] focus:ring-[#FFB800]/50 shadow-[0_0_15px_rgba(255,184,0,0.35)]',
    ghost:
      'bg-transparent text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1A253D] active:bg-[#223254] focus:ring-[#64748B]/40',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
      <span>{children}</span>
    </button>
  );
});

export function CyberCard({
  children,
  className = '',
  glow = false,
  glowColor = 'cyan',
  corner = true,
  ...props
}) {
  const glowClasses = {
    cyan: 'border-[#00F0FF]/40 shadow-[0_0_20px_rgba(0,240,255,0.12)]',
    magenta: 'border-[#FF0055]/40 shadow-[0_0_20px_rgba(255,0,85,0.12)]',
    amber: 'border-[#FFB800]/40 shadow-[0_0_20px_rgba(255,184,0,0.12)]',
  };

  return (
    <div
      className={`relative bg-[#0D121F]/90 border border-[#223254] backdrop-blur-md transition-all duration-300 ${
        glow ? glowClasses[glowColor] : 'hover:border-[#334B7D]'
      } ${corner ? 'cyber-cut' : 'rounded-lg'} ${className}`}
      {...props}
    >
      {/* Decorative cyber corner ticks */}
      <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#00F0FF]/40 pointer-events-none" />
      <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#00F0FF]/40 pointer-events-none" />
      {children}
    </div>
  );
}

export function CyberBadge({ children, variant = 'cyan', className = '' }) {
  const variants = {
    cyan: 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40',
    magenta: 'bg-[#FF0055]/15 text-[#FF0055] border-[#FF0055]/40',
    amber: 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/40',
    emerald: 'bg-[#00FF9D]/15 text-[#00FF9D] border-[#00FF9D]/40',
    slate: 'bg-[#1E293B] text-[#94A3B8] border-[#334155]',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-telemetry tracking-wide uppercase font-semibold border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function CyberProgressBar({ progressPct = 0, label, sublabel, color = 'cyan', height = 'h-3' }) {
  const safeProgress = Math.min(100, Math.max(0, progressPct));

  const colors = {
    cyan: 'from-[#00F0FF] to-[#38E1FF] shadow-[0_0_12px_rgba(0,240,255,0.5)]',
    magenta: 'from-[#FF0055] to-[#FF4D88] shadow-[0_0_12px_rgba(255,0,85,0.5)]',
    amber: 'from-[#FFB800] to-[#FFDA7A] shadow-[0_0_12px_rgba(255,184,0,0.5)]',
    emerald: 'from-[#00FF9D] to-[#5CFFC2] shadow-[0_0_12px_rgba(0,255,157,0.5)]',
  };

  return (
    <div className="w-full space-y-1.5">
      {(label || sublabel) && (
        <div className="flex justify-between text-xs font-telemetry uppercase tracking-wider text-[#94A3B8]">
          <span>{label}</span>
          <span className="text-[#E2E8F0] font-mono-cyber font-semibold">{sublabel || `${safeProgress}%`}</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(safeProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
        className={`w-full bg-[#07090E] border border-[#223254] p-0.5 ${height} overflow-hidden`}
      >
        <div
          className={`h-full bg-gradient-to-r transition-all duration-500 ease-out ${colors[color]}`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
}

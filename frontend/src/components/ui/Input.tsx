import type { InputHTMLAttributes } from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { designSystem } from '@/constants/designSystem';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { isDark } = useTheme();
  const themeClasses = isDark
    ? 'border-white/10 bg-white/5 text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-primary/30'
    : 'border-slate-300/80 bg-white/95 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500/20';
  const className = `${props.className ?? ''} w-full ${designSystem.borderRadius} border px-4 py-3 text-sm outline-none backdrop-blur-sm ${designSystem.transitions} focus:ring-2 ${themeClasses}`.trim();
  return (
    <input
      {...props}
      className={className}
    />
  );
}

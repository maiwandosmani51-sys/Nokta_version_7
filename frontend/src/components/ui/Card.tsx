import type { HTMLAttributes, ReactNode } from 'react';
import { designSystem } from '@/constants/designSystem';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`glass-card ${designSystem.borderRadius} ${designSystem.spacing.card} ${designSystem.transitions} hover-glow ${className}`}
    >
      {children}
    </div>
  );
}

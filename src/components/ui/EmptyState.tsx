import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox className="w-12 h-12 text-slate-300" />,
  title,
  description,
  actionText,
  onAction,
  className
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-10 text-center bg-white rounded-xl border border-dashed border-slate-200 ${className}`}>
      <div className="p-4 bg-slate-50 rounded-2xl mb-4 border border-slate-100">{icon}</div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} icon={<Plus className="w-4 h-4" />}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

import React from 'react';
import { RequestStatus } from '../../types';
import { Badge, BadgeProps } from './Badge';

interface StatusBadgeProps {
  status: RequestStatus | string;
  size?: BadgeProps['size'];
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className }) => {
  let variant: BadgeProps['variant'] = 'slate';

  switch (status) {
    case 'استلام الطلب':
      variant = 'slate';
      break;
    case 'قيد المراجعة':
      variant = 'blue';
      break;
    case 'تم إرسال الطلب للجهة':
      variant = 'indigo';
      break;
    case 'قيد المعالجة':
      variant = 'amber';
      break;
    case 'مطلوب مستندات':
      variant = 'rose';
      break;
    case 'موافقة':
      variant = 'emerald';
      break;
    case 'مرفوض':
      variant = 'rose';
      break;
    case 'الإجابة جاهزة':
      variant = 'cyan';
      break;
    case 'تم إشعار المراجع':
      variant = 'purple';
      break;
    case 'تم التسليم':
      variant = 'emerald';
      break;
    case 'مغلق':
      variant = 'slate';
      break;
    case 'نشط':
      variant = 'emerald';
      break;
    case 'غير نشط':
    case 'محظور':
      variant = 'rose';
      break;
    default:
      variant = 'slate';
  }

  return (
    <Badge variant={variant} size={size} dot className={className}>
      {status}
    </Badge>
  );
};

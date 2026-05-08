import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const loadingVariants = cva(
  'animate-spin rounded-full border-2 border-current border-t-transparent text-primary-600',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        default: 'h-8 w-8',
        lg: 'h-12 w-12',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  label?: string;
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, size, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center gap-2', className)}
        role="status"
        aria-label={label || 'Loading'}
        {...props}
      >
        <div className={cn(loadingVariants({ size }))} />
        {label && (
          <p className="text-sm text-muted-foreground">{label}</p>
        )}
        <span className="sr-only">{label || 'Loading'}</span>
      </div>
    );
  }
);
Loading.displayName = 'Loading';

export { Loading, loadingVariants };

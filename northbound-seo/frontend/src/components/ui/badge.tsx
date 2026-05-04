import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-medium',
  {
    variants: {
      variant: {
        default: 'bg-surface2 text-text border border-border',
        success: 'bg-accent2/15 text-accent2 border border-accent2/30',
        warning: 'bg-warning/15 text-warning border border-warning/30',
        danger: 'bg-danger/15 text-danger border border-danger/30',
        info: 'bg-accent/15 text-accent border border-accent/30',
        dim: 'bg-surface2 text-dim border border-border',
        purple: 'bg-purple/15 text-purple border border-purple/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

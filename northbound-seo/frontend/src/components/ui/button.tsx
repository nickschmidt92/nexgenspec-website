'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-bg hover:bg-accent/90',
        outline:
          'border border-border bg-transparent text-text hover:bg-surface2 hover:border-dim',
        ghost:
          'bg-transparent text-text hover:bg-surface2',
        danger:
          'bg-danger text-white hover:bg-danger/90',
        success:
          'bg-accent2 text-bg hover:bg-accent2/90',
        dim:
          'bg-surface2 text-dim hover:bg-border hover:text-text',
      },
      size: {
        sm: 'h-7 rounded px-3 text-xs',
        md: 'h-9 rounded-md px-4',
        lg: 'h-11 rounded-md px-6 text-base',
        icon: 'h-9 w-9 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

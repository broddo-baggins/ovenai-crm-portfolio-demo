import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ColoredButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'light' | 'outline' | 'ghost';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const ColoredButton = React.forwardRef<HTMLButtonElement, ColoredButtonProps>(
  (
    {
      variant = 'default',
      color = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      className,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? React.Fragment : 'button';

    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
      md: 'px-4 py-2 text-base rounded-lg gap-2',
      lg: 'px-6 py-3 text-lg rounded-lg gap-2.5',
      xl: 'px-8 py-4 text-xl rounded-xl gap-3',
    };

    const colorVariants = {
      default: {
        primary:
          'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-blue-500 shadow-sm',
        success:
          'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white focus:ring-green-500 shadow-sm',
        warning:
          'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white focus:ring-amber-500 shadow-sm',
        danger:
          'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white focus:ring-red-500 shadow-sm',
        info: 'bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white focus:ring-cyan-500 shadow-sm',
        purple:
          'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white focus:ring-purple-500 shadow-sm',
      },
      light: {
        primary:
          'bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 focus:ring-blue-500',
        success:
          'bg-green-50 hover:bg-green-100 active:bg-green-200 text-green-700 focus:ring-green-500',
        warning:
          'bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-700 focus:ring-amber-500',
        danger:
          'bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 focus:ring-red-500',
        info: 'bg-cyan-50 hover:bg-cyan-100 active:bg-cyan-200 text-cyan-700 focus:ring-cyan-500',
        purple:
          'bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-700 focus:ring-purple-500',
      },
      outline: {
        primary:
          'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 focus:ring-blue-500',
        success:
          'border-2 border-green-600 text-green-600 hover:bg-green-50 active:bg-green-100 focus:ring-green-500',
        warning:
          'border-2 border-amber-600 text-amber-600 hover:bg-amber-50 active:bg-amber-100 focus:ring-amber-500',
        danger:
          'border-2 border-red-600 text-red-600 hover:bg-red-50 active:bg-red-100 focus:ring-red-500',
        info: 'border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 active:bg-cyan-100 focus:ring-cyan-500',
        purple:
          'border-2 border-purple-600 text-purple-600 hover:bg-purple-50 active:bg-purple-100 focus:ring-purple-500',
      },
      ghost: {
        primary:
          'text-blue-600 hover:bg-blue-50 active:bg-blue-100 focus:ring-blue-500',
        success:
          'text-green-600 hover:bg-green-50 active:bg-green-100 focus:ring-green-500',
        warning:
          'text-amber-600 hover:bg-amber-50 active:bg-amber-100 focus:ring-amber-500',
        danger:
          'text-red-600 hover:bg-red-50 active:bg-red-100 focus:ring-red-500',
        info: 'text-cyan-600 hover:bg-cyan-50 active:bg-cyan-100 focus:ring-cyan-500',
        purple:
          'text-purple-600 hover:bg-purple-50 active:bg-purple-100 focus:ring-purple-500',
      },
    };

    const iconSize = {
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6',
    };

    if (asChild) {
      return (
        <>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                ...props,
                ...child.props,
                className: cn(
                  baseStyles,
                  sizeStyles[size],
                  colorVariants[variant][color],
                  fullWidth && 'w-full',
                  loading && 'relative cursor-wait',
                  className,
                  child.props.className
                ),
                disabled: disabled || loading,
                children: (
                  <>
                    {loading && (
                      <Loader2
                        className={cn(
                          'absolute inset-0 m-auto animate-spin',
                          iconSize[size]
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        'flex items-center',
                        sizeStyles[size].split(' ').pop(),
                        loading && 'invisible'
                      )}
                    >
                      {leftIcon &&
                        React.cloneElement(leftIcon as React.ReactElement, {
                          className: cn(iconSize[size], (leftIcon as any).props?.className),
                        })}
                      {child.props.children}
                      {rightIcon &&
                        React.cloneElement(rightIcon as React.ReactElement, {
                          className: cn(iconSize[size], (rightIcon as any).props?.className),
                        })}
                    </span>
                  </>
                ),
              });
            }
            return child;
          })}
        </>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          sizeStyles[size],
          colorVariants[variant][color],
          fullWidth && 'w-full',
          loading && 'relative cursor-wait',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2
            className={cn('absolute inset-0 m-auto animate-spin', iconSize[size])}
          />
        )}
        <span
          className={cn(
            'flex items-center',
            sizeStyles[size].split(' ').pop(),
            loading && 'invisible'
          )}
        >
          {leftIcon &&
            React.cloneElement(leftIcon as React.ReactElement, {
              className: cn(iconSize[size], (leftIcon as any).props?.className),
            })}
          {children}
          {rightIcon &&
            React.cloneElement(rightIcon as React.ReactElement, {
              className: cn(iconSize[size], (rightIcon as any).props?.className),
            })}
        </span>
      </button>
    );
  }
);

ColoredButton.displayName = 'ColoredButton';

export { ColoredButton }; 
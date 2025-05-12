import React from 'react';

import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  styleType?: 'default' | 'outline' | 'soft' | 'ghost' | 'link' | 'wide';
}

const buttonClasses = ({ size, styleType, variant }: ButtonProps) => {
  const baseClass = 'btn';
  const variantClass = variant ? `btn-${variant}` : 'btn-primary';
  const sizeClass = size ? `btn-${size}` : 'btn-md';
  const styleClass = styleType && styleType !== 'default' ? `btn-${styleType}` : '';

  return [baseClass, variantClass, sizeClass, styleClass].join(' ').trim();
};

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  size = 'md',
  styleType = 'default',
  variant = 'primary',
  ...props
}) => {
  const buttonClass = buttonClasses({ size, styleType, variant });

  return (
    <button className={clsx(buttonClass, className)} {...props}>
      {children}
    </button>
  );
};

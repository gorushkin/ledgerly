import React from 'react';

import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  ghost?: boolean;
  link?: boolean;
  outline?: boolean;
  soft?: boolean;
  wide?: boolean;
}

const buttonClasses = ({ ghost, link, outline, size, soft, variant, wide }: ButtonProps) => {
  const baseClass = 'btn';
  const variantClass = variant ? `btn-${variant}` : 'btn-primary';
  const sizeClass = size ? `btn-${size}` : 'btn-md';
  const ghostClass = ghost ? 'btn-ghost' : '';
  const linkClass = link ? 'btn-link' : '';
  const outlineClass = outline ? 'btn-outline' : '';
  const softClass = soft ? 'btn-soft' : '';
  const wideClass = wide ? 'btn-wide' : '';

  return [baseClass, variantClass, sizeClass, ghostClass, linkClass, outlineClass, softClass, wideClass]
    .join(' ')
    .trim();
};

export const Button: React.FC<ButtonProps> = ({ children, className, size = 'md', variant = 'primary', ...props }) => {
  const buttonClass = buttonClasses({ ...props, size, variant });

  return (
    <button className={clsx(buttonClass, className, '')} type="button" {...props}>
      {children}
    </button>
  );
};

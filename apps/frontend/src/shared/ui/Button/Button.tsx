import React from "react";
import classNames from "classnames";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error"
    | "neutral";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  styleType?: "default" | "outline" | "soft" | "ghost" | "link" | "wide";
}

const buttonClasses = ({ variant, size, styleType }: ButtonProps) => {
  const baseClass = "btn";
  const variantClass = variant ? `btn-${variant}` : "btn-primary";
  const sizeClass = size ? `btn-${size}` : "btn-md";
  const styleClass =
    styleType && styleType !== "default" ? `btn-${styleType}` : "";

  return [baseClass, variantClass, sizeClass, styleClass].join(" ").trim();
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  styleType = "default",
  className,
  children,
  ...props
}) => {
  const buttonClass = buttonClasses({ variant, size, styleType });

  return (
    <button className={clsx(buttonClass, className)} {...props}>
      {children}
    </button>
  );
};

import { Button as MuiButton, CircularProgress } from "@mui/material";
import type { ButtonProps as MuiButtonProps } from "@mui/material";
import { forwardRef } from "react";

type ButtonVariant = "text" | "contained" | "outlined";
type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends Omit<MuiButtonProps, "variant" | "size"> {
  /**
   * The variant to use.
   * @default 'text'
   */
  variant?: ButtonVariant;
  /**
   * The size of the component.
   * @default 'medium'
   */
  size?: ButtonSize;
  /**
   * If `true`, the button will take up the full width of its container.
   * @default false
   */
  fullWidth?: boolean;
  /**
   * If `true`, the button will be disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * If `true`, the button will show a loading spinner.
   * @default false
   */
  loading?: boolean;
  /**
   * The color of the component.
   * @default 'primary'
   */
  color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  /**
   * The URL to link to when the button is clicked.
   * If defined, an `a` element will be used as the root node.
   */
  href?: string;
  /**
   * The content of the component.
   */
  children?: React.ReactNode;
  /**
   * Callback fired when the button is clicked.
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * The type of the button.
   * @default 'button'
   */
  type?: "button" | "submit" | "reset";
  /**
   * Element placed before the children.
   */
  startIcon?: React.ReactNode;
  /**
   * Element placed after the children.
   */
  endIcon?: React.ReactNode;
}

/**
 * Buttons allow users to take actions, and make choices, with a single tap.
 *
 * The Button component replaces the native HTML `<button>` element and offers
 * more styling and customization options.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "text",
      size = "medium",
      color = "primary",
      fullWidth = false,
      disabled = false,
      loading = false,
      children,
      startIcon,
      endIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Don't show both loading spinner and icon
    const startIconNode = loading ? (
      <CircularProgress size={20} color="inherit" />
    ) : (
      startIcon
    );

    return (
      <MuiButton
        ref={ref}
        variant={variant}
        size={size}
        color={color}
        fullWidth={fullWidth}
        disabled={disabled || loading}
        type={type}
        startIcon={startIconNode}
        endIcon={endIcon}
        {...props}
        sx={{
          textTransform: "none",
          borderRadius: 2,
          fontWeight: 600,
          letterSpacing: 0.5,
          ...(size === "small" && {
            fontSize: "0.8125rem",
            padding: "4px 10px",
          }),
          ...(size === "medium" && {
            fontSize: "0.875rem",
            padding: "6px 16px",
          }),
          ...(size === "large" && {
            fontSize: "0.9375rem",
            padding: "8px 22px",
          }),
          ...props.sx,
        }}
      >
        {loading && !startIcon ? null : children}
      </MuiButton>
    );
  }
);

Button.displayName = "Button";

export default Button;

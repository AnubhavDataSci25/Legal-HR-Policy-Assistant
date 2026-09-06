import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";

const VARIANTS = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary:
    "bg-transparent text-text border border-border hover:bg-surface-hover hover:border-border-strong",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text",
};

/**
 * Standard action button. Use `variant="primary"` for the single most
 * important action in a given context, `secondary` for supporting
 * actions, `ghost` for low-emphasis inline actions.
 */
export default function Button({
  children,
  variant = "primary",
  className,
  disabled,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      whileTap={shouldReduceMotion || disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.12 }}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
        "transition-colors duration-micro ease-smooth disabled:opacity-45 disabled:cursor-not-allowed",
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
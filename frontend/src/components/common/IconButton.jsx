import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";

/**
 * Compact circular icon-only button, used in the header and inline
 * toolbars. Always requires an aria-label since there's no visible text.
 */
export default function IconButton({ children, className, active, ...props }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
      transition={{ duration: 0.12 }}
      className={clsx(
        "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
        "text-text-secondary border border-border",
        "hover:bg-surface-hover hover:text-text hover:border-border-strong",
        "transition-colors duration-micro ease-smooth",
        active && "bg-surface-hover text-text border-border-strong",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
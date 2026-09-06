import clsx from "clsx";

const VARIANTS = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-hover text-text-secondary",
  accent: "bg-accent-soft text-accent",
};

/**
 * Small status pill. Always pair the color with an icon or text label --
 * never rely on color alone to convey meaning (accessibility requirement).
 */
export default function Badge({ children, variant = "neutral", icon: Icon, className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        VARIANTS[variant],
        className
      )}
    >
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {children}
    </span>
  );
}
import { motion, useReducedMotion } from "framer-motion";

/**
 * A single quick-action tile. `primary` gets the accent treatment;
 * everything else is a quieter secondary action.
 */
export default function QuickActionCard({ icon: Icon, label, description, onClick, primary = false }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      onClick={onClick}
      className="flex-1 min-w-[200px] rounded-xl p-4 flex items-start gap-3 text-left transition-colors duration-standard"
      style={{
        backgroundColor: primary ? "var(--accent)" : "var(--surface-elevated)",
        border: `1px solid ${primary ? "var(--accent)" : "var(--border)"}`,
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: primary ? "rgba(255,255,255,0.18)" : "var(--accent-soft)" }}
      >
        <Icon size={17} color={primary ? "#FFFFFF" : "var(--accent)"} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: primary ? "#FFFFFF" : "var(--text-primary)" }}>
          {label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: primary ? "rgba(255,255,255,0.8)" : "var(--text-muted)" }}>
          {description}
        </p>
      </div>
    </motion.button>
  );
}
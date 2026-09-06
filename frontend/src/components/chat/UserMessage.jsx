import { motion, useReducedMotion } from "framer-motion";
import { User } from "lucide-react";

export default function UserMessage({ text }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="flex gap-3 flex-row-reverse"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--accent)" }}
      >
        <User size={15} color="#FFFFFF" />
      </div>
      <div
        className="rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[75%] text-sm leading-relaxed"
        style={{ backgroundColor: "var(--accent)", color: "#FFFFFF" }}
      >
        {text}
      </div>
    </motion.div>
  );
}
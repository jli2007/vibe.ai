// AlertFlash.tsx
import { useEffect } from "react";
import { motion } from "motion/react";

export default function AlertFlash({
  message,
  onClose,
}: {
  message: "IN" | "OUT" | "STATE";
  onClose: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onClose, 2000);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <motion.div
      key={message}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className={`fixed left-1/2 bottom-5 -translate-x-1/2 text-white px-4 py-2 rounded shadow ${
        message === "IN"
          ? "bg-emerald-500"
          : message === "STATE"
          ? "bg-blue-500"
          : "bg-red-500"
      }`}
    >
      {message === "IN"
        ? "successfully logged in"
        : message === "STATE"
        ? "session reverted"
        : "successfully logged out"}
    </motion.div>
  );
}

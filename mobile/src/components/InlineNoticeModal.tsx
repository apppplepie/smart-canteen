import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { THEME } from "../config/theme";

export function InlineNoticeModal({
  open,
  title,
  message,
  detail,
  confirmLabel = "知道了",
  onConfirm,
}: {
  open: boolean;
  title: string;
  message?: string;
  detail?: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onConfirm}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            {message ? (
              <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{message}</p>
            ) : null}
            {detail ? <div className="mb-6">{detail}</div> : null}
            <button
              type="button"
              onClick={onConfirm}
              className="w-full py-3 rounded-2xl font-bold text-white"
              style={{ backgroundColor: THEME.colors.primary }}
            >
              {confirmLabel}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

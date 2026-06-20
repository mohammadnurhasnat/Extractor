import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function GlobalProgress({ loading }: { loading: boolean }) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 h-1 bg-blue-100 dark:bg-blue-900/30 z-[100] overflow-hidden"
        >
          <motion.div
            className="absolute top-0 bottom-0 bg-blue-600 dark:bg-blue-500"
            initial={{ left: '-10%', width: '30%' }}
            animate={{ left: '110%' }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

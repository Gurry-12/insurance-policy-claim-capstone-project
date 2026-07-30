import { motion } from 'framer-motion';

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 6 }}
    transition={{
      opacity: { duration: 0.18, ease: 'easeOut' },
      y:       { duration: 0.18, ease: 'easeOut' },
    }}
    style={{ width: '100%' }}
  >
    {children}
  </motion.div>
);

export default PageTransition;

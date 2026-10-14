/**
 * Shared Motion variants (motion/react). Transform/opacity only, short
 * durations, and everything is softened automatically when the user
 * prefers reduced motion (MotionConfig reducedMotion="user" in App.jsx).
 */
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export const popIn = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
};

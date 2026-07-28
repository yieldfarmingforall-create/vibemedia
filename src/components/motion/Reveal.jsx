import React from 'react';
import { motion } from 'framer-motion';

const VARIANTS = {
  up: { hidden: { opacity: 0, y: 48, filter: 'blur(8px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)' } },
  scale: { hidden: { opacity: 0, scale: 0.92, filter: 'blur(10px)' }, show: { opacity: 1, scale: 1, filter: 'blur(0px)' } },
  left: { hidden: { opacity: 0, x: -60, filter: 'blur(6px)' }, show: { opacity: 1, x: 0, filter: 'blur(0px)' } },
};

// Cinematic scroll-reveal wrapper. Respects prefers-reduced-motion automatically via Framer.
export default function Reveal({ children, variant = 'up', delay = 0, className = '', as = 'div', once = true, amount = 0.3 }) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={VARIANTS[variant] || VARIANTS.up}
      transition={{ duration: 0.9, delay, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {children}
    </MotionTag>
  );
}
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Toast.css';

const Toast = ({ isOpen, title, message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, duration]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={`toast toast--${type}`}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        >
          <div className="toast-icon">
            {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
          </div>
          <div className="toast-content">
            {title && <h4 className="toast-title">{title}</h4>}
            <p className="toast-message">{message}</p>
          </div>
          <button className="toast-close" onClick={onClose}>×</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;

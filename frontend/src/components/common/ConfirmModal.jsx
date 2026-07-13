import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false, hideCancel = false, children }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="confirm-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="confirm-modal glass-card"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
        >
          <h2 className="confirm-modal-title">{title}</h2>
          <p className="confirm-modal-message">{message}</p>
          
          {children && <div className="confirm-modal-content">{children}</div>}

          <div className="confirm-modal-actions">
            {!hideCancel && (
              <button className="confirm-btn-cancel" onClick={onCancel}>
                {cancelText}
              </button>
            )}
            <button 
              className={`confirm-btn-confirm ${isDanger ? 'confirm-btn-danger' : ''}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmModal;

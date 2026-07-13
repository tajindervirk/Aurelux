import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../../services/apiService';
import './AdblockWarningModal.css';

const AdblockWarningModal = ({ isOpen, onContinue, onClose }) => {
  if (!isOpen) return null;

  const handleInstallClick = async () => {
    // Open uBlock Origin in a new tab
    window.open('https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm', '_blank');
    
    // Update backend tracking silently
    try {
      await apiService.patch('/user/adblock-status');
    } catch (err) {
      console.warn('Failed to update adblock tracking', err);
    }
  };

  return (
    <AnimatePresence>
      <div className="adblock-modal-overlay">
        <motion.div 
          className="adblock-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
        >
          <div className="adblock-modal__icon">⚠️</div>
          <h2 className="adblock-modal__title gold-text">Adblocker Recommended</h2>
          
          <p className="adblock-modal__desc">
            To enjoy a seamless streaming experience without popups or redirects, we highly recommend using an adblocker like <strong>uBlock Origin</strong> or switching to the <strong>Brave Browser</strong>.
          </p>

          <div className="adblock-modal__actions">
            <button className="adblock-modal__btn adblock-modal__btn--install" onClick={handleInstallClick}>
              Get Adblocker
            </button>
            <button className="adblock-modal__btn adblock-modal__btn--continue" onClick={onContinue}>
              Continue to Player
            </button>
          </div>

          <button className="adblock-modal__close" onClick={onClose}>✕</button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdblockWarningModal;

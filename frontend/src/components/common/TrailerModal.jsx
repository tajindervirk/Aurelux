import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import YouTube from 'react-youtube';
import './TrailerModal.css';

const TrailerModal = ({ isOpen, onClose, videoKey }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset states when videoKey or modal state changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [videoKey, isOpen]);

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      window.addEventListener('keydown', onEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!videoKey) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="trailer-modal__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="trailer-modal__content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="trailer-modal__close" onClick={onClose} aria-label="Close trailer">
              ✕
            </button>
            <div className="trailer-modal__video-wrapper">
              {hasError ? (
                <motion.div 
                  className="trailer-modal__error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                  <p>Trailer unavailable for preview</p>
                  <a 
                    href={`https://youtube.com/watch?v=${videoKey}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="trailer-modal__error-btn"
                  >
                    Watch on YouTube ↗
                  </a>
                </motion.div>
              ) : (
                <YouTube
                  videoId={videoKey}
                  opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: { 
                      autoplay: 1, 
                      rel: 0, 
                      origin: window.location.origin 
                    }
                  }}
                  onReady={() => setIsLoaded(true)}
                  onError={() => setHasError(true)}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrailerModal;

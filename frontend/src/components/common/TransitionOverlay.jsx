import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import './TransitionOverlay.css';

const TransitionOverlay = () => {
  const location = useLocation();
  const controls = useAnimation();
  const textControls = useAnimation();
  const [isFirstMount, setIsFirstMount] = useState(true);

  useEffect(() => {
    // Skip the overlay animation on the very first mount since SplashScreen handles it
    if (isFirstMount) {
      setIsFirstMount(false);
      return;
    }

    const runSequence = async () => {
      // 1. Instantly reset position to bottom edge (off screen)
      controls.set({ y: '100%' });
      
      // 2. Slide up to cover screen securely (200ms)
      await controls.start({ y: '0%', transition: { duration: 0.2, ease: 'easeInOut' } });

      // 3. Show AURELUX text (total 200ms pause)
      textControls.set({ opacity: 0 });
      await textControls.start({ opacity: 1, transition: { duration: 0.1 } });
      await new Promise(resolve => setTimeout(resolve, 100)); // Pause mid-point

      // 4. Hide AURELUX text
      await textControls.start({ opacity: 0, transition: { duration: 0.1 } });

      // 5. Slide up off screen to top (200ms)
      await controls.start({ y: '-100%', transition: { duration: 0.2, ease: 'easeInOut' } });
    };

    runSequence();
  }, [location.pathname, controls, textControls, isFirstMount]);

  return (
    <motion.div 
      className="transition-overlay-container"
      initial={{ top: 0, y: '-100%' }} // Keep it off-screen initially
      animate={controls}
    >
      <motion.div className="transition-overlay-content">
        <motion.h1 
          className="transition-overlay-text"
          initial={{ opacity: 0 }}
          animate={textControls}
        >
          AURELUX
        </motion.h1>
      </motion.div>
    </motion.div>
  );
};

export default TransitionOverlay;

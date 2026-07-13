import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hasShown = localStorage.getItem('aurelux_splash_shown');
    if (hasShown === 'true') {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem('aurelux_splash_shown', 'true');
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          className="splash-screen-container"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Cinematic Film Grain Overlay */}
          <div className="splash-grain-overlay"></div>
          
          {/* Main Branding Container */}
          <main className="splash-main-content">
            {/* Logo Text */}
            <div className="splash-logo-wrapper">
              <h1 className="splash-logo-text">
                AURELUX
              </h1>
            </div>
            
            {/* Animated Underline */}
            <div className="splash-underline-container">
              <div className="splash-gold-line-draw"></div>
            </div>
            
            {/* Subtext / Status */}
            <div className="splash-subtext-container">
              <p className="splash-subtext">
                A Project by FalconOP
              </p>
            </div>
          </main>
          
          {/* Decorative Corner Accents (Subtle Luxury Framing) */}
          <div className="splash-corner splash-corner-tl-h"></div>
          <div className="splash-corner splash-corner-tl-v"></div>
          <div className="splash-corner splash-corner-br-h"></div>
          <div className="splash-corner splash-corner-br-v"></div>
          
          {/* Background Atmospheric Glow */}
          <div className="splash-atmospheric-glow"></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;

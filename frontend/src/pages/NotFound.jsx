import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--color-bg-primary)',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <motion.h1 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '10rem', 
          color: 'var(--color-gold)',
          margin: 0,
          lineHeight: 1
        }}
      >
        404
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.5rem',
          color: 'var(--color-text-primary)',
          marginTop: '1rem',
          marginBottom: '0.5rem'
        }}
      >
        Scene Not Found
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '1.1rem',
          marginBottom: '2.5rem'
        }}
      >
        The page you're looking for doesn't exist.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        onClick={() => navigate('/')}
        style={{
          background: 'var(--color-gold)',
          color: '#000',
          border: 'none',
          padding: '1rem 2.5rem',
          borderRadius: 'var(--border-radius-full)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: '1.1rem',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-gold)',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        Go Home
      </motion.button>
    </main>
  );
};

export default NotFound;

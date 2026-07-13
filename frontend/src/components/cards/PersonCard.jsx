import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getPosterUrl } from '../../services/tmdbService';
import './PersonCard.css';

const PersonCard = ({ person }) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  if (!person) return null;

  return (
    <motion.div
      className="person-card"
      whileHover={{ scale: 1.06 }}
      transition={{ duration: 0.3 }}
      onClick={() => navigate(`/person/${person.id}`)}
    >
      <div className="person-card__image-wrap">
        <img
          className="person-card__image"
          src={imgError ? '/placeholder-poster.jpg' : getPosterUrl(person.profile_path, 'w300')}
          alt={person.name}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
        />
      </div>
      <h4 className="person-card__name">{person.name}</h4>
      {person.known_for_department && (
        <span className="person-card__dept">{person.known_for_department}</span>
      )}
    </motion.div>
  );
};

export default PersonCard;

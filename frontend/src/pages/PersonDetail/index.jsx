import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPersonDetails, getPosterUrl } from '../../services/tmdbService';
import Carousel from '../../components/common/Carousel';
import MovieCard from '../../components/cards/MovieCard';
import './PersonDetail.css';

const PersonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    const fetchPerson = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPersonDetails(id);
        setPerson(data);
      } catch (err) {
        setError('Failed to fetch person details.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchPerson();
      setVisibleCount(15);
    }
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="person-detail-loading">
        <div className="spinner-large" />
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="person-detail-error">
        <h2>Actor not found</h2>
        <button onClick={() => navigate(-1)} className="auth-submit-btn" style={{ width: 'auto', padding: '0.8rem 2rem', marginTop: '1rem' }}>Go Back</button>
      </div>
    );
  }

  const allCredits = person.combined_credits?.cast
    ?.sort((a, b) => b.popularity - a.popularity) || [];
  
  const knownFor = allCredits.slice(0, visibleCount);
  const hasMore = visibleCount < allCredits.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 15, allCredits.length));
  };

  return (
    <div className="person-page">
      <div className="person__content">
        <div className="person__left">
          <img 
            className="person__poster" 
            src={getPosterUrl(person.profile_path, 'original')} 
            alt={person.name} 
            onError={(e) => { e.target.src = '/placeholder-poster.jpg'; }}
          />
          
          <div className="person__info-box glass-card">
            <h3 className="person__info-title">Personal Info</h3>
            
            <div className="person__info-item">
              <strong>Known For</strong>
              <span>{person.known_for_department}</span>
            </div>
            
            <div className="person__info-item">
              <strong>Gender</strong>
              <span>{person.gender === 1 ? 'Female' : person.gender === 2 ? 'Male' : 'Other'}</span>
            </div>
            
            {person.birthday && (
              <div className="person__info-item">
                <strong>Birthday</strong>
                <span>{new Date(person.birthday).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
            
            {person.deathday && (
              <div className="person__info-item">
                <strong>Day of Death</strong>
                <span>{new Date(person.deathday).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
            
            {person.place_of_birth && (
              <div className="person__info-item">
                <strong>Place of Birth</strong>
                <span>{person.place_of_birth}</span>
              </div>
            )}
          </div>
        </div>

        <div className="person__right">
          <h1 className="person__title">{person.name}</h1>
          
          <div className="person__bio-section">
            <h3 className="person__section-title">Biography</h3>
            <div className="person__bio">
              {person.biography ? (
                person.biography.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))
              ) : (
                <p style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                  We don't have a biography for {person.name}.
                </p>
              )}
            </div>
          </div>

          {knownFor.length > 0 && (
            <div className="person__known-for" style={{ marginTop: '3rem' }}>
              <Carousel 
                title="Known For" 
                items={knownFor.map(item => ({...item, mediaType: item.media_type}))}
                CardComponent={MovieCard}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonDetail;

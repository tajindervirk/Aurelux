import './SkeletonCard.css';

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card__poster skeleton" />
      <div className="skeleton-card__info">
        <div className="skeleton-card__title skeleton" />
        <div className="skeleton-card__sub skeleton" />
      </div>
    </div>
  );
};

export default SkeletonCard;

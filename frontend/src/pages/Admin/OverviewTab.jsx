import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import apiService from '../../services/apiService';

const OverviewTab = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMovies: 0,
    totalReviews: 0,
  });
  const [recentMovies, setRecentMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        // Fetch all data in parallel
        const [usersRes, moviesRes] = await Promise.all([
          apiService.get('/admin/users'),
          apiService.get('/admin/movies')
        ]);

        if (usersRes.success && moviesRes.success) {
          const users = usersRes.data.users || [];
          const movies = moviesRes.data.movies || [];

          setStats({
            totalUsers: usersRes.data.totalCount || users.length,
            activeUsers: users.filter(u => !u.isBanned).length,
            totalMovies: moviesRes.data.totalCount || movies.length,
            totalReviews: 0, // Placeholder
          });

          // Get last 5 added movies based on creation date or just last 5 array elements
          setRecentMovies(movies.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to fetch overview data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥' },
    { label: 'Total Movies', value: stats.totalMovies, icon: '🎥' },
    { label: 'Active Users', value: stats.activeUsers, icon: '✅' },
    { label: 'Total Reviews', value: stats.totalReviews, icon: '⭐' },
  ];

  return (
    <div className="admin-overview">
      <div className="admin-stats-grid">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.label}
            className="admin-stat-card glass-card"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.1, duration: 0.3 }}
          >
            <div className="admin-stat-card__icon gold-text">{card.icon}</div>
            <div className="admin-stat-card__info">
              <h3>{loading ? '-' : card.value}</h3>
              <p>{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="admin-recent-activity">
        <h2>Recent Activity</h2>
        
        {loading ? (
          <div className="spinner-small" style={{ margin: '2rem auto' }} />
        ) : recentMovies.length > 0 ? (
          <div className="admin-activity-list">
            {recentMovies.map(movie => (
              <div key={movie._id} className="admin-activity-item">
                <img 
                  src={movie.posterPath?.startsWith('http') ? movie.posterPath : `https://image.tmdb.org/t/p/w200${movie.posterPath}`}
                  alt={movie.title}
                  onError={(e) => { e.target.src = '/placeholder-poster.jpg'; }}
                  className="admin-activity-poster"
                />
                <div className="admin-activity-details">
                  <h4>{movie.title}</h4>
                  <div className="admin-activity-meta">
                    <span className="admin-badge-category">{movie.mediaType?.toUpperCase() || 'MOVIE'}</span>
                    <span className="admin-date">Added {new Date(movie.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="admin-empty">No recent activity found.</p>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;

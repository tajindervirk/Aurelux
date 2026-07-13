import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../../services/apiService';
import useDebounce from '../../hooks/useDebounce';

const MoviesTab = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '', tmdbId: '', posterPath: '', overview: '',
    releaseDate: '', trailerUrl: '', genres: '', mediaType: 'movie'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await apiService.get(`/admin/movies?page=${page}&limit=10${debouncedSearch ? `&search=${debouncedSearch}` : ''}`);
      if (res.success) {
        setMovies(res.data.movies);
        setTotalPages(res.data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [page, debouncedSearch]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        const res = await apiService.delete(`/admin/movies/${id}`);
        if (res.success) fetchMovies();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openModal = (movie = null) => {
    setFormError('');
    if (movie) {
      setEditingMovie(movie);
      setFormData({
        title: movie.title,
        tmdbId: movie.tmdbId,
        posterPath: movie.posterPath,
        overview: movie.overview || '',
        releaseDate: movie.releaseDate ? movie.releaseDate.split('T')[0] : '',
        trailerUrl: movie.trailerUrl || '',
        genres: movie.genres ? movie.genres.join(', ') : '',
        mediaType: movie.mediaType || 'movie'
      });
    } else {
      setEditingMovie(null);
      setFormData({
        title: '', tmdbId: '', posterPath: '', overview: '',
        releaseDate: '', trailerUrl: '', genres: '', mediaType: 'movie'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMovie(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        genres: formData.genres.split(',').map(g => g.trim()).filter(Boolean)
      };

      let res;
      if (editingMovie) {
        res = await apiService.put(`/admin/movies/${editingMovie._id}`, payload);
      } else {
        res = await apiService.post('/admin/movies', payload);
      }

      if (res.success) {
        closeModal();
        fetchMovies(); // refresh list
      } else {
        setFormError(res.message);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-tab">
      {/* Header */}
      <div className="admin-tab-header">
        <div className="admin-search-wrap">
          <span className="admin-search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search movies by title..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button className="admin-btn-primary" onClick={() => openModal()}>
          + Add Movie
        </button>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Poster</th>
              <th>Title</th>
              <th>Category</th>
              <th>Genres</th>
              <th>Release Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner-small" style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : movies.length > 0 ? (
              movies.map((movie) => (
                <tr key={movie._id}>
                  <td data-label="Poster">
                    <img 
                      src={movie.posterPath ? `https://image.tmdb.org/t/p/w200${movie.posterPath}` : '/placeholder-poster.png'} 
                      alt={movie.title}
                      className="admin-table-poster"
                    />
                  </td>
                  <td data-label="Title">
                    <span className="admin-table-text" style={{ fontWeight: 600 }}>{movie.title}</span>
                  </td>
                  <td data-label="Category">
                    <span className="admin-badge-category">{movie.mediaType.toUpperCase()}</span>
                  </td>
                  <td data-label="Genres">
                    <div className="admin-genres-stack">
                      {movie.genres?.map(g => <span key={g} className="admin-badge-genre">{g}</span>)}
                    </div>
                  </td>
                  <td data-label="Release Date">
                    <span className="admin-date">
                      {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="admin-table-actions">
                      <button className="admin-icon-btn" onClick={() => openModal(movie)} title="Edit">✏️</button>
                      <button className="admin-icon-btn admin-icon-btn--danger" onClick={() => handleDelete(movie._id)} title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="admin-empty">No movies found. Click 'Add Movie' to start.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="admin-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div 
              className="admin-modal glass-card"
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            >
              <h2>{editingMovie ? 'Edit Movie' : 'Add New Movie'}</h2>
              
              <form onSubmit={handleSubmit} className="admin-form">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Movie Title *</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                  </div>
                  <div className="admin-form-group">
                    <label>TMDB ID * <small>(from themoviedb.org)</small></label>
                    <input type="number" value={formData.tmdbId} onChange={e => setFormData({...formData, tmdbId: e.target.value})} required />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Category</label>
                    <select value={formData.mediaType} onChange={e => setFormData({...formData, mediaType: e.target.value})}>
                      <option value="movie">Movie</option>
                      <option value="tv">TV Show</option>
                      <option value="anime">Anime</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Release Date</label>
                    <input type="date" value={formData.releaseDate} onChange={e => setFormData({...formData, releaseDate: e.target.value})} />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Poster Image URL *</label>
                  <input type="text" value={formData.posterPath} onChange={e => setFormData({...formData, posterPath: e.target.value})} required placeholder="/some_path.jpg OR https://..." />
                </div>

                <div className="admin-form-group">
                  <label>Genres <small>(comma separated)</small></label>
                  <input type="text" value={formData.genres} onChange={e => setFormData({...formData, genres: e.target.value})} placeholder="Action, Drama, Sci-Fi" />
                </div>

                <div className="admin-form-group">
                  <label>Trailer YouTube Link</label>
                  <input type="url" value={formData.trailerUrl} onChange={e => setFormData({...formData, trailerUrl: e.target.value})} placeholder="https://www.youtube.com/watch?v=..." />
                </div>

                <div className="admin-form-group">
                  <label>Overview/Description</label>
                  <textarea rows="4" value={formData.overview} onChange={e => setFormData({...formData, overview: e.target.value})} />
                </div>

                {formError && <div className="admin-error">{formError}</div>}

                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn-outline" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="admin-btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : (editingMovie ? 'Update Movie' : 'Add Movie')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoviesTab;

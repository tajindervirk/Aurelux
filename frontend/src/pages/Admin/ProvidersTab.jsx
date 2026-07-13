import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchProviders } from '../../store/slices/providerSlice';
import apiService from '../../services/apiService';
import toast from 'react-hot-toast';

const ProvidersTab = () => {
  const dispatch = useDispatch();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);

  const [formData, setFormData] = useState({
    providerId: '',
    name: '',
    description: '',
    animeIdType: 'mal',
    movieUrlTemplate: '',
    tvUrlTemplate: '',
    animeUrlTemplate: '',
    isActive: true,
  });

  const loadProviders = async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/admin/providers');
      if (res.success) {
        setProviders(res.data);
      }
    } catch (error) {
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleOpenModal = (provider = null) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        providerId: provider.providerId,
        name: provider.name,
        description: provider.description || '',
        animeIdType: provider.animeIdType || 'mal',
        movieUrlTemplate: provider.movieUrlTemplate,
        tvUrlTemplate: provider.tvUrlTemplate,
        animeUrlTemplate: provider.animeUrlTemplate,
        isActive: provider.isActive,
      });
    } else {
      setEditingProvider(null);
      setFormData({
        providerId: '',
        name: '',
        description: '',
        animeIdType: 'mal',
        movieUrlTemplate: '',
        tvUrlTemplate: '',
        animeUrlTemplate: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProvider(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProvider) {
        await apiService.put(`/admin/providers/${editingProvider._id}`, formData);
        toast.success('Provider updated');
      } else {
        await apiService.post('/admin/providers', formData);
        toast.success('Provider added');
      }
      handleCloseModal();
      loadProviders();
      // Also update the redux store for the frontend
      dispatch(fetchProviders());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save provider');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this provider?')) {
      try {
        await apiService.delete(`/admin/providers/${id}`);
        toast.success('Provider deleted');
        loadProviders();
        dispatch(fetchProviders());
      } catch (error) {
        toast.error('Failed to delete provider');
      }
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading providers...</div>;
  }

  return (
    <div className="admin-tab-container">
      <div className="admin-tab-header">
        <h2>Streaming Providers</h2>
        <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
          + Add Provider
        </button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Anime ID Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map(provider => (
              <tr key={provider._id}>
                <td><code>{provider.providerId}</code></td>
                <td><strong>{provider.name}</strong></td>
                <td><span className="admin-badge-type">{provider.animeIdType.toUpperCase()}</span></td>
                <td>
                  <span className={`admin-status ${provider.isActive ? 'admin-status--active' : 'admin-status--inactive'}`}>
                    {provider.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button className="admin-icon-btn" onClick={() => handleOpenModal(provider)} title="Edit">✏️</button>
                    <button className="admin-icon-btn admin-icon-btn--danger" onClick={() => handleDelete(provider._id)} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr>
                <td colSpan="5" className="admin-table-empty">No providers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{editingProvider ? 'Edit Provider' : 'Add New Provider'}</h3>
              <button className="admin-modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Provider ID (Unique)</label>
                <input
                  type="text"
                  name="providerId"
                  value={formData.providerId}
                  onChange={handleChange}
                  placeholder="e.g. vidlink"
                  required
                  disabled={!!editingProvider} // Cannot change ID once created
                />
              </div>

              <div className="admin-form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. VidLink"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="e.g. Fast & reliable"
                />
              </div>

              <div className="admin-form-group">
                <label>Anime ID Requirement</label>
                <select name="animeIdType" value={formData.animeIdType} onChange={handleChange}>
                  <option value="tmdb">TMDB</option>
                  <option value="mal">MyAnimeList (MAL)</option>
                  <option value="anilist">AniList</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>Movie URL Template</label>
                <input
                  type="text"
                  name="movieUrlTemplate"
                  value={formData.movieUrlTemplate}
                  onChange={handleChange}
                  placeholder="https://example.com/movie/{id}"
                  required
                />
                <small>Available tags: {`{id}`}</small>
              </div>

              <div className="admin-form-group">
                <label>TV Show URL Template</label>
                <input
                  type="text"
                  name="tvUrlTemplate"
                  value={formData.tvUrlTemplate}
                  onChange={handleChange}
                  placeholder="https://example.com/tv/{id}/{s}/{e}"
                  required
                />
                <small>Available tags: {`{id}, {s}, {e}`}</small>
              </div>

              <div className="admin-form-group">
                <label>Anime URL Template</label>
                <input
                  type="text"
                  name="animeUrlTemplate"
                  value={formData.animeUrlTemplate}
                  onChange={handleChange}
                  placeholder="https://example.com/anime/{id}/{ep}/{subDub}"
                  required
                />
                <small>Available tags: {`{id}, {ep}, {subDub}`}</small>
              </div>

              <div className="admin-form-checkbox">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <label htmlFor="isActive">Active (Show in player)</label>
              </div>

              <div className="admin-form-actions">
                <button type="button" className="admin-btn-outline" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  Save Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvidersTab;

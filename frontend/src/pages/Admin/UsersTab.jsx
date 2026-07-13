import { useState, useEffect } from 'react';
import apiService from '../../services/apiService';
import useDebounce from '../../hooks/useDebounce';

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiService.get(`/admin/users?page=${page}&limit=10${debouncedSearch ? `&search=${debouncedSearch}` : ''}`);
      if (res.success) {
        setUsers(res.data.users);
        setTotalPages(res.data.pages);
        setTotalUsers(res.data.totalCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch]);

  const handleToggleBan = async (id, isCurrentlyBanned) => {
    try {
      // Optimistic update
      setUsers(users.map(u => u._id === id ? { ...u, isBanned: !isCurrentlyBanned } : u));
      const res = await apiService.patch(`/admin/users/${id}/ban`);
      if (!res.success) {
        // Revert on failure
        setUsers(users.map(u => u._id === id ? { ...u, isBanned: isCurrentlyBanned } : u));
      }
    } catch (err) {
      console.error(err);
      fetchUsers(); // Refresh source of truth
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This removes all their data.')) {
      try {
        const res = await apiService.delete(`/admin/users/${id}`);
        if (res.success) fetchUsers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatTimeSpent = (minutes) => {
    if (!minutes) return '0m';
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="admin-tab">
      {/* Header */}
      <div className="admin-tab-header">
        <div className="admin-search-wrap">
          <span className="admin-search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="admin-counts">
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            {totalUsers} total users
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Browser/Device</th>
              <th>Time Spent</th>
              <th>Adblocker</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner-small" style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id}>
                  <td data-label="User">
                    <div className="admin-user-cell">
                      <div className="admin-user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="admin-table-text" style={{ fontWeight: 500 }}>{user.name}</span>
                    </div>
                  </td>
                  <td data-label="Email">
                    <span className="admin-table-text" title={user.email}>
                      {user.email.length > 25 ? user.email.substring(0, 25) + '...' : user.email}
                    </span>
                  </td>
                  <td data-label="Role">
                    <span className={`admin-badge-role admin-badge-role--${user.role}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td data-label="Status">
                    {(() => {
                      const isOnline = user.lastActive && (new Date() - new Date(user.lastActive)) < 15 * 60 * 1000; // 15 mins
                      let statusText = 'Offline';
                      let statusClass = 'offline';
                      
                      if (user.isBanned) {
                        statusText = 'Banned';
                        statusClass = 'banned';
                      } else if (isOnline) {
                        statusText = 'Active';
                        statusClass = 'active';
                      }
                      
                      return (
                        <span className={`admin-badge-status ${statusClass}`}>
                          {statusText}
                        </span>
                      );
                    })()}
                  </td>
                  <td data-label="Browser/Device">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {user.browserUsed || 'Unknown'} {user.deviceType ? `(${user.deviceType})` : ''}
                    </div>
                  </td>
                  <td data-label="Time Spent">
                    <span className="admin-table-text">{formatTimeSpent(user.totalTimeSpent)}</span>
                  </td>
                  <td data-label="Adblocker">
                    {user.adblockerInstalled ? (
                      <span className="admin-badge-status active">Installed</span>
                    ) : (
                      <span className="admin-table-text" style={{ opacity: 0.5 }}>No</span>
                    )}
                  </td>
                  <td data-label="Joined" style={{ whiteSpace: 'nowrap' }}>
                    <span className="admin-table-text">
                      {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                    </span>
                  </td>
                  <td data-label="Actions" style={{ whiteSpace: 'nowrap' }}>
                    <div className="admin-table-actions">
                      {user.role !== 'admin' && (
                        <button 
                          className={`admin-btn-action ${user.isBanned ? 'unban' : 'ban'}`}
                          onClick={() => handleToggleBan(user._id, user.isBanned)}
                        >
                          {user.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      )}
                      {user.role !== 'admin' && (
                        <button className="admin-icon-btn admin-icon-btn--danger" onClick={() => handleDelete(user._id)} title="Delete">🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="admin-empty">No users found.</td>
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
    </div>
  );
};

export default UsersTab;

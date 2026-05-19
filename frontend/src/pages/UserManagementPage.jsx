import React, { useState, useEffect, useCallback } from 'react';
import GovHeader from '../components/GovHeader';
import GovSidebar from '../components/GovSidebar';
import GovSkeleton from '../components/GovSkeleton';
import GovEmpty from '../components/GovEmpty';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

const UserManagementPage = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'public_user' });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data?.data || []);
    } catch (err) {
      showToast('Error', 'Failed to fetch users list', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      showToast('Success', `User status changed to ${newStatus}`, 'success');
    } catch (err) {
      showToast('Error', 'Failed to update user status', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Create user endpoint (admin can register anyone)
      await api.post('/admin/users', form);
      showToast('Success', 'User created successfully', 'success');
      setIsModalOpen(false);
      setForm({ name: '', email: '', password: '', role: 'public_user' });
      fetchUsers();
    } catch (err) {
      showToast('Error', err.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Search & Filters
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    const matchesStatus = statusFilter ? u.status === statusFilter : true;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="flex flex-col h-screen bg-surface font-sans text-gray-900 overflow-hidden">
      <GovHeader />
      <div className="flex flex-1 overflow-hidden">
        <GovSidebar />

        <main id="main-content" className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-[20px] font-bold text-primary uppercase tracking-wide">User Management Portal</h2>
              <p className="text-[12px] text-gray-500 font-medium mt-0.5">Control roles, authorization state, and active system operators.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="gov-btn-primary flex items-center gap-2 px-5 py-2.5 text-[13px] shadow-sm font-bold uppercase tracking-wider"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add New User
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-lg border border-border shadow-sm flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="gov-form-label">Search Users</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..." 
                  className="gov-form-input pl-9"
                />
                <span className="absolute left-3 top-3.5 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
              </div>
            </div>

            <div className="w-full md:w-48">
              <label className="gov-form-label">Role</label>
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="gov-form-input"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="public_user">Public User</option>
                <option value="traffic_officer">Traffic Officer</option>
              </select>
            </div>

            <div className="w-full md:w-48">
              <label className="gov-form-label">Status</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="gov-form-input"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6"><GovSkeleton type="table" rows={6} /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8">
                <GovEmpty title="No Users Found" subtitle="No registered operators match the current filter criteria." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-border">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role Assigned</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined On</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-primary text-[14px]">{u.name}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            u.role === 'admin' 
                              ? 'bg-primary text-white' 
                              : u.role === 'traffic_officer'
                                ? 'bg-accent/20 text-primary border border-accent/30'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {u.role?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            u.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          }`}>
                            {u.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 font-mono text-[12px]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleUserStatus(u.id, u.status)}
                            className={`text-[11px] font-bold px-3 py-1 rounded border transition-all ${
                              u.status === 'active'
                                ? 'border-danger text-danger hover:bg-danger hover:text-white'
                                : 'border-success text-success hover:bg-success hover:text-white'
                            }`}
                          >
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-border rounded-xl shadow-2xl p-7 mx-4">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-[18px] font-bold text-primary mb-1 uppercase tracking-wide">Register New Operator</h3>
            <p className="text-[12px] text-gray-500 mb-5 font-medium">Create direct operator accounts bypass registration guards.</p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="gov-form-label required">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})} 
                  className="gov-form-input" 
                  placeholder="e.g. Inspector Gurpreet Singh"
                />
              </div>
              <div>
                <label className="gov-form-label required">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={form.email} 
                  onChange={(e) => setForm({...form, email: e.target.value})} 
                  className="gov-form-input" 
                  placeholder="e.g. g.singh@police.punjab.gov.in"
                />
              </div>
              <div>
                <label className="gov-form-label required">Password</label>
                <input 
                  type="password" 
                  required 
                  value={form.password} 
                  onChange={(e) => setForm({...form, password: e.target.value})} 
                  className="gov-form-input" 
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="gov-form-label">System Role</label>
                <select 
                  value={form.role} 
                  onChange={(e) => setForm({...form, role: e.target.value})} 
                  className="gov-form-input"
                >
                  <option value="public_user">Public User</option>
                  <option value="traffic_officer">Traffic Officer</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 gov-btn-outline h-10 uppercase tracking-wider font-bold text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 gov-btn-primary h-10 flex items-center justify-center gap-2 uppercase tracking-wider font-bold text-xs"
                >
                  {submitting ? 'Creating...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;

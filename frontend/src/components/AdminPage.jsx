import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  Activity,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Lock,
  User,
  Database,
  Cpu,
  Server,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  Truck,
  ShieldCheck,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  approveUser,
  rejectUser,
  getSystemMetrics,
} from '../api/adminApi';

export default function AdminPage({ currentUser, onClose }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'metrics'

  // Users State
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals & Action States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Create User Form State
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('DRIVER');
  const [newStatus, setNewStatus] = useState('APPROVED');
  const [newIsActive, setNewIsActive] = useState(true);

  // Edit User Form State
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState('DRIVER');
  const [editStatus, setEditStatus] = useState('APPROVED');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editNewPassword, setEditNewPassword] = useState('');

  // Metrics State
  const [metrics, setMetrics] = useState(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState(null);
  const [autoRefreshMetrics, setAutoRefreshMetrics] = useState(false);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setActionError(null);
    try {
      const data = await listUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setActionError(err.response?.data?.message || err.message || 'Failed to load users.');
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Fetch Metrics
  const fetchMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    setMetricsError(null);
    try {
      const data = await getSystemMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
      setMetricsError(err.response?.data?.message || err.message || 'Failed to load system metrics.');
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'metrics') {
      fetchMetrics();
    }
  }, [activeTab, fetchUsers, fetchMetrics]);

  // Auto-refresh metrics every 10s if enabled
  useEffect(() => {
    if (!autoRefreshMetrics || activeTab !== 'metrics') return;
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [autoRefreshMetrics, activeTab, fetchMetrics]);

  const showTempSuccess = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // User Actions: Approve
  const handleApprove = async (userId, assignedRole) => {
    setActionError(null);
    try {
      await approveUser(userId, assignedRole);
      showTempSuccess('User approved successfully.');
      fetchUsers();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Approval failed.');
    }
  };

  // User Actions: Reject
  const handleReject = async (userId) => {
    setActionError(null);
    try {
      await rejectUser(userId);
      showTempSuccess('User access request rejected.');
      fetchUsers();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Rejection failed.');
    }
  };

  // User Actions: Create
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newFullName.trim() || !newUsername.trim() || !newPassword) {
      setActionError('Full Name, Username, and Password are required.');
      return;
    }

    try {
      await createUser({
        fullName: newFullName.trim(),
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
        status: newStatus,
        isActive: newIsActive,
      });

      setShowCreateModal(false);
      setNewFullName('');
      setNewUsername('');
      setNewPassword('');
      setNewRole('DRIVER');
      setNewStatus('APPROVED');
      setNewIsActive(true);
      showTempSuccess('User created successfully.');
      fetchUsers();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to create user.');
    }
  };

  // User Actions: Open Edit Modal
  const handleStartEdit = (user) => {
    setEditingUser(user);
    setEditFullName(user.fullName || '');
    setEditRole(user.role || 'DRIVER');
    setEditStatus(user.status || 'APPROVED');
    setEditIsActive(Boolean(user.isActive));
    setEditNewPassword('');
    setActionError(null);
  };

  // User Actions: Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const payload = {
        fullName: editFullName.trim(),
        role: editRole,
        status: editStatus,
        isActive: editIsActive,
      };
      if (editNewPassword.trim()) {
        payload.password = editNewPassword.trim();
      }

      await updateUser(editingUser.userId, payload);
      setEditingUser(null);
      showTempSuccess('User updated successfully.');
      fetchUsers();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update user.');
    }
  };

  // User Actions: Delete
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    try {
      await deleteUser(deletingUser.userId, currentUser?.username);
      setDeletingUser(null);
      showTempSuccess('User deleted successfully.');
      fetchUsers();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to delete user.');
    }
  };

  // Pending users
  const pendingUsers = users.filter((u) => (u.status || '').toUpperCase() === 'PENDING');

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch.trim() ||
      (u.fullName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(userSearch.toLowerCase());

    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'PENDING' && (u.status || '').toUpperCase() === 'PENDING') ||
      (u.role || '').toUpperCase() === roleFilter.toUpperCase();

    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex flex-col flex-1 pb-16 bg-slate-50 min-h-screen">
      {/* Top Admin Navigation Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              title="Return to Route Planner"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                NetYX <span className="text-purple-600">Admin Console</span>
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                User Management & System Telemetry
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Done
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex space-x-1.5 mt-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Management</span>
            {pendingUsers.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'users' ? 'bg-amber-400 text-slate-950' : 'bg-amber-500 text-white'
              }`}>
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'metrics'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Health & Metrics</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Success Alert */}
        {actionSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Error Alert */}
        {actionError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 1: USER MANAGEMENT                                       */}
        {/* ============================================================ */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="text-base font-black text-slate-900">{users.length}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</div>
              </div>
              <div className={`p-2.5 rounded-2xl border shadow-2xs ${
                pendingUsers.length > 0 ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-200'
              }`}>
                <div className={`text-base font-black ${pendingUsers.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                  {pendingUsers.length}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</div>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="text-base font-black text-slate-900">
                  {users.filter((u) => (u.role || '').toUpperCase() === 'DRIVER').length}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drivers</div>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="text-base font-black text-slate-900">
                  {users.filter((u) => ['ADMIN', 'DISPATCH'].includes((u.role || '').toUpperCase())).length}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff</div>
              </div>
            </div>

            {/* PENDING APPROVAL REQUESTS SECTION */}
            {pendingUsers.length > 0 && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 space-y-3 shadow-2xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Pending Access Requests ({pendingUsers.length})</span>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    Action Required
                  </span>
                </div>

                <div className="space-y-2">
                  {pendingUsers.map((pendingUser) => (
                    <div
                      key={pendingUser.userId}
                      className="bg-white border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-900">{pendingUser.fullName}</span>
                          <span className="text-[11px] text-slate-500 font-medium">(@{pendingUser.username})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                          <span>Requested: <strong className="text-indigo-600 uppercase">{pendingUser.role}</strong></span>
                          <span>•</span>
                          <span>{new Date(pendingUser.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleReject(pendingUser.userId)}
                          className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center space-x-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(pendingUser.userId, pendingUser.role)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1 transition-colors shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve as {pendingUser.role}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* USERS LIST HEADER & CONTROLS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    All System Users
                  </h3>
                  <p className="text-[11px] text-slate-500">Manage credentials, permissions and access status</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add User</span>
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or username..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
                  {['ALL', 'ADMIN', 'DISPATCH', 'DRIVER', 'PENDING'].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setRoleFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                        roleFilter === filter
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Cards / List */}
              {isLoadingUsers ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="text-xs">Loading user registry...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No users found matching your search.
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {filteredUsers.map((u) => {
                    const roleUpper = (u.role || '').toUpperCase();
                    const statusUpper = (u.status || '').toUpperCase();
                    const isSelf = currentUser?.username?.toLowerCase() === u.username?.toLowerCase();

                    return (
                      <div
                        key={u.userId}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                          statusUpper === 'PENDING'
                            ? 'bg-amber-50/40 border-amber-200'
                            : !u.isActive
                            ? 'bg-slate-50/70 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                            roleUpper === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : roleUpper === 'DISPATCH'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {roleUpper === 'ADMIN' ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : roleUpper === 'DISPATCH' ? (
                              <Users className="w-4 h-4" />
                            ) : (
                              <Truck className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5 truncate">
                              <span className="text-xs font-bold text-slate-900 truncate">{u.fullName}</span>
                              <span className="text-[10px] text-slate-400">(@{u.username})</span>
                              {isSelf && (
                                <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.2 rounded-full">
                                  You
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-1.5 mt-0.5">
                              {/* Role Badge */}
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                roleUpper === 'ADMIN'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : roleUpper === 'DISPATCH'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {roleUpper}
                              </span>

                              {/* Status Badge */}
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                statusUpper === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : statusUpper === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-700'
                              }`}>
                                {statusUpper}
                              </span>

                              {!u.isActive && (
                                <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded">
                                  Disabled
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 shrink-0 ml-2">
                          {statusUpper === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(u.userId, u.role)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                              title="Approve User"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStartEdit(u)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeletingUser(u)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSelf
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                            }`}
                            title={isSelf ? 'Cannot delete self' : 'Delete User'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: SYSTEM HEALTH & METRICS                               */}
        {/* ============================================================ */}
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            {/* Header & Refresh */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live System Health
                </h3>
                <p className="text-[11px] text-slate-500">
                  {metrics?.timestamp ? `Updated at ${new Date(metrics.timestamp).toLocaleTimeString()}` : 'Real-time telemetry'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefreshMetrics}
                    onChange={(e) => setAutoRefreshMetrics(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Auto (10s)</span>
                </label>

                <button
                  type="button"
                  onClick={fetchMetrics}
                  disabled={isLoadingMetrics}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {isLoadingMetrics && !metrics ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
                <span className="text-xs">Gathering system diagnostics...</span>
              </div>
            ) : metricsError ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{metricsError}</span>
              </div>
            ) : metrics ? (
              <div className="space-y-3.5 animate-in fade-in">
                {/* Status Hero Card */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-2xs ${
                  metrics.dbStatus === 'HEALTHY'
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-950'
                    : 'bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${
                      metrics.dbStatus === 'HEALTHY' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {metrics.dbStatus === 'HEALTHY' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-black leading-tight">
                        {metrics.dbStatus === 'HEALTHY' ? 'All Systems Operational' : 'Database Status Degraded'}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">
                        Spring Boot 4.2 • Java {metrics.jvmVersion} • Windows Nginx Reverse Proxy
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/80 border border-emerald-200 text-emerald-800 shadow-2xs">
                      {metrics.dbLatencyMs >= 0 ? `${metrics.dbLatencyMs} ms ping` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Section 1: Database Health */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <span>Database Health & Connection Pool</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div className="text-xs font-bold text-slate-700 truncate">{metrics.dbProductName}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Engine</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div className="text-xs font-bold text-emerald-600">
                        {metrics.dbLatencyMs >= 0 ? `${metrics.dbLatencyMs} ms` : 'Disconnected'}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Roundtrip</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div className="text-xs font-bold text-indigo-600">
                        {metrics.hikariActiveConnections ?? 0} / {metrics.hikariMaxConnections ?? 10}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Hikari Active</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div className="text-xs font-bold text-slate-700">
                        {metrics.hikariIdleConnections ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Pool Idle</div>
                    </div>
                  </div>

                  {/* Database Tables Summary */}
                  {metrics.tableCounts && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 mb-2">Record Counts:</div>
                      <div className="grid grid-cols-5 gap-1 text-center text-xs">
                        <div className="bg-slate-50/90 py-1.5 px-1 rounded-lg border border-slate-200">
                          <div className="font-extrabold text-slate-800">{metrics.tableCounts['app_users'] ?? 0}</div>
                          <div className="text-[9px] text-slate-400">Users</div>
                        </div>
                        <div className="bg-slate-50/90 py-1.5 px-1 rounded-lg border border-slate-200">
                          <div className="font-extrabold text-slate-800">{metrics.tableCounts['drivers'] ?? 0}</div>
                          <div className="text-[9px] text-slate-400">Drivers</div>
                        </div>
                        <div className="bg-slate-50/90 py-1.5 px-1 rounded-lg border border-slate-200">
                          <div className="font-extrabold text-slate-800">{metrics.tableCounts['route_manifests'] ?? 0}</div>
                          <div className="text-[9px] text-slate-400">Routes</div>
                        </div>
                        <div className="bg-slate-50/90 py-1.5 px-1 rounded-lg border border-slate-200">
                          <div className="font-extrabold text-slate-800">{metrics.tableCounts['route_stops'] ?? 0}</div>
                          <div className="text-[9px] text-slate-400">Stops</div>
                        </div>
                        <div className="bg-slate-50/90 py-1.5 px-1 rounded-lg border border-slate-200">
                          <div className="font-extrabold text-slate-800">{metrics.tableCounts['route_links'] ?? 0}</div>
                          <div className="text-[9px] text-slate-400">Links</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: Server & JVM Runtime */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <Server className="w-4 h-4 text-purple-600" />
                    <span>Server & JVM Performance</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Host OS & CPU</div>
                      <div className="font-bold text-slate-900 mt-0.5">{metrics.osName} ({metrics.osArch})</div>
                      <div className="text-[11px] text-slate-500">{metrics.availableProcessors} logical cores</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Service Uptime</div>
                      <div className="font-bold text-slate-900 mt-0.5">{metrics.formattedUptime}</div>
                      <div className="text-[11px] text-slate-500">Adoptium JDK {metrics.jvmVersion}</div>
                    </div>
                  </div>

                  {/* Heap Memory Progress */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">JVM Heap Memory</span>
                      <span className="font-extrabold text-purple-700">{metrics.heapUsedMb} MB / {metrics.heapMaxMb} MB ({metrics.heapUsedPercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(metrics.heapUsedPercent, 100)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>Total Allocated: {metrics.heapTotalMb} MB</span>
                      <span>Max Available: {metrics.heapMaxMb} MB</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Integrations & API Status */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>External Service Integrations</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Google Maps API</div>
                        <div className="text-[10px] text-slate-500">Routes & Geocoding</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        metrics.googleMapsConfigured
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {metrics.googleMapsConfigured ? 'Active' : 'Missing Key'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Gemini 3.8 Flash</div>
                        <div className="text-[10px] text-slate-500">Image Address OCR</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        metrics.geminiConfigured
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {metrics.geminiConfigured ? 'Active' : 'Missing Key'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: CREATE USER                                           */}
      {/* ============================================================ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Create New User</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. jdoe"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-semibold"
                  >
                    <option value="DRIVER">Driver</option>
                    <option value="DISPATCH">Dispatch</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-semibold"
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="newIsActive"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="newIsActive" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Account Active
                </label>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT USER                                             */}
      {/* ============================================================ */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Edit User Details</h3>
                <p className="text-[11px] text-slate-500">@{editingUser.username}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-semibold"
                  >
                    <option value="DRIVER">Driver</option>
                    <option value="DISPATCH">Dispatch</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-semibold"
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Reset Password <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="Leave blank to keep unchanged"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="editIsActive" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Account Active
                </label>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: DELETE CONFIRMATION                                   */}
      {/* ============================================================ */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete User?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete user{' '}
                  <strong className="text-slate-900">{deletingUser.fullName}</strong> (@{deletingUser.username})?
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

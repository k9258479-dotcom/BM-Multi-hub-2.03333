import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Key, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Trash2, 
  Edit, 
  Layers, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Sparkles,
  Shield,
  Building,
  Check,
  X
} from 'lucide-react';
import { User, UserRole, AdAccount, Client } from '../types';
import { logAuditEvent } from '../lib/storage';

interface TeamRBACViewProps {
  users: User[];
  accounts: AdAccount[];
  clients: Client[];
  currentUser: User | null;
  theme: 'dark' | 'light';
  onCreateUser: (newUser: User) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: string) => void;
}

export const TeamRBACView: React.FC<TeamRBACViewProps> = ({
  users,
  accounts,
  clients,
  currentUser,
  theme,
  onCreateUser,
  onUpdateUser,
  onDeleteUser
}) => {
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  const [tempAssignedAssets, setTempAssignedAssets] = useState<string[]>([]);

  // Create User form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('media_buyer');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState('');

  // Strict RBAC Permissions:
  // 1. Super Admin: CAN create user IDs & passwords, CAN assign assets, CAN delete users
  // 2. Account Manager: CAN assign assets only (CANNOT create user IDs, CANNOT delete users)
  // 3. Others (Media Buyer, Client Viewer): CANNOT create user IDs, CANNOT assign assets
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAccountManager = currentUser?.role === 'account_manager';
  const canCreateUser = isSuperAdmin;
  const canAssignAssets = isSuperAdmin || isAccountManager;

  const toggleAssetSelection = (assetId: string) => {
    if (selectedAssetIds.includes(assetId)) {
      setSelectedAssetIds(selectedAssetIds.filter(id => id !== assetId));
    } else {
      setSelectedAssetIds([...selectedAssetIds, assetId]);
    }
  };

  const toggleTempAssetSelection = (assetId: string) => {
    if (tempAssignedAssets.includes(assetId)) {
      setTempAssignedAssets(tempAssignedAssets.filter(id => id !== assetId));
    } else {
      setTempAssignedAssets([...tempAssignedAssets, assetId]);
    }
  };

  const handleOpenAssignModal = (user: User) => {
    if (!canAssignAssets) return;
    setAssigningUser(user);
    setTempAssignedAssets([...user.assignedAssetIds]);
  };

  const handleSaveAssetAssignment = () => {
    if (!assigningUser) return;
    const updatedUser: User = {
      ...assigningUser,
      assignedAssetIds: tempAssignedAssets
    };
    onUpdateUser(updatedUser);
    logAuditEvent({
      userId: currentUser?.id || 'mgr',
      userName: currentUser?.name || 'Account Manager',
      action: 'ASSIGN_ASSETS_TO_USER',
      resource: assigningUser.id,
      details: `${currentUser?.role === 'super_admin' ? 'Super Admin' : 'Account Manager'} updated asset assignment for user "${assigningUser.username}" (${tempAssignedAssets.length} assets assigned).`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS'
    });
    setAssigningUser(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateUser) {
      setError('Permission Denied: Only Super Admins can create user IDs.');
      return;
    }

    setError('');

    if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
      setError(`User ID "${username}" already exists. Please choose a unique user ID.`);
      return;
    }

    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      username: username.trim(),
      password: password.trim(),
      name: fullName || username,
      email: email || `${username}@agencyhub.com`,
      role,
      assignedAssetIds: role === 'super_admin' ? ['*'] : selectedAssetIds,
      createdAt: new Date().toISOString(),
      mfaEnabled: false,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`
    };

    onCreateUser(newUser);
    logAuditEvent({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Super Admin',
      action: 'CREATE_USER_AND_ASSIGN_ASSETS',
      resource: newUser.id,
      details: `Super Admin created user ID "${newUser.username}" with role ${newUser.role} and assigned ${newUser.assignedAssetIds.length} assets.`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS'
    });

    // Reset
    setUsername('');
    setPassword('');
    setFullName('');
    setEmail('');
    setSelectedAssetIds([]);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-cinzel text-xl font-extrabold gold-text-gradient">
              TEAM & CLIENT ROLE-BASED ACCESS CONTROL (RBAC)
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Super Admin provisions user IDs & passwords. Account Managers delegate client assets.
          </p>
        </div>

        {/* Action Button depending on user role */}
        {canCreateUser ? (
          <button
            id="btn-create-user-modal"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl gold-btn text-xs font-bold uppercase tracking-wider flex items-center space-x-2 self-start sm:self-auto shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User ID & Assign Asset</span>
          </button>
        ) : canAssignAssets ? (
          <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-600/40 text-purple-300 text-xs font-semibold">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Account Manager: Asset Delegation Active</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-gray-400 text-xs">
            <Lock className="w-4 h-4" />
            <span>Read-Only Directory</span>
          </div>
        )}
      </div>

      {/* Admin Notice Box */}
      <div className="p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-[#F3E5AB]">
              {isSuperAdmin && 'Super Admin Access Clearance'}
              {isAccountManager && 'Account Manager Asset Delegation Clearance'}
              {!isSuperAdmin && !isAccountManager && 'Standard Role View-Only Access'}
            </div>
            <div className="text-[11px] text-gray-400">
              {isSuperAdmin && 'You have full authorization to create user IDs, set passwords, delete users, and assign ad assets.'}
              {isAccountManager && 'You are authorized to assign and delegate ad assets to team members. (User creation is restricted to Super Admin).'}
              {!isSuperAdmin && !isAccountManager && 'Your role allows viewing team directories and working only within your designated ad assets.'}
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 font-bold px-2.5 py-1 bg-emerald-950/40 rounded border border-emerald-600/40 self-start md:self-auto">
          STRICT RBAC ENFORCED
        </span>
      </div>

      {/* User Directory Table */}
      <div className={`rounded-2xl border overflow-hidden ${
        theme === 'dark' ? 'dream-card' : 'dream-card-light'
      }`}>
        <div className="p-5 border-b border-gray-800/80 flex items-center justify-between">
          <h3 className="font-cinzel text-base font-bold text-white flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <span>Authorized Team Members & Client Users ({users.length})</span>
          </h3>
          <span className="text-[11px] text-gray-400 font-mono">
            {canAssignAssets ? 'Click "Assign Assets" to manage client accounts' : 'View-Only Directory'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-[10px] uppercase font-mono bg-black/20">
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">User ID (Login)</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Assets & Accounts</th>
                <th className="py-3 px-4">MFA (2FA)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {users.map((user) => {
                const isKimAdmin = user.username === 'kim';
                const showPass = showPasswords[user.id];

                return (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    
                    {/* User name & email */}
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-xs font-bold text-[#F3E5AB]">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            user.username.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{user.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* User ID */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#F3E5AB] bg-[#121722] px-2.5 py-1 rounded border border-gray-700">
                        {user.username}
                      </span>
                    </td>

                    {/* Password with Show/Hide toggle (Super Admin or Self) */}
                    <td className="py-3 px-4">
                      {isSuperAdmin || currentUser?.id === user.id ? (
                        <div className="flex items-center space-x-1.5">
                          <span className="text-gray-300">
                            {showPass ? user.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => setShowPasswords(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                            className="p-1 text-gray-400 hover:text-[#D4AF37]"
                          >
                            {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">••••••••</span>
                      )}
                    </td>

                    {/* Role Badge */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        user.role === 'super_admin' ? 'bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40' :
                        user.role === 'media_buyer' ? 'bg-blue-900/40 text-blue-300 border border-blue-700/40' :
                        user.role === 'account_manager' ? 'bg-purple-900/40 text-purple-300 border border-purple-700/40' :
                        'bg-gray-800 text-gray-300 border border-gray-700'
                      }`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Assigned Assets */}
                    <td className="py-3 px-4 font-sans">
                      {user.assignedAssetIds.includes('*') ? (
                        <span className="text-[11px] text-[#D4AF37] font-semibold flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                          <span>All Global Client Assets</span>
                        </span>
                      ) : user.assignedAssetIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.assignedAssetIds.map(assetId => {
                            const acc = accounts.find(a => a.id === assetId || a.accountId === assetId);
                            return (
                              <span key={assetId} className="px-2 py-0.5 rounded text-[10px] bg-[#121722] border border-gray-700 text-gray-300">
                                {acc?.accountName || assetId}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-500 italic">No assigned assets</span>
                      )}
                    </td>

                    {/* MFA Status */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        user.mfaEnabled ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-600/40' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {user.mfaEnabled ? 'ACTIVE' : 'OFF'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Assign Asset Button: Available to Super Admin & Account Manager */}
                        {canAssignAssets && user.role !== 'super_admin' && (
                          <button
                            onClick={() => handleOpenAssignModal(user)}
                            title="Assign & Delegate Ad Assets"
                            className="px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold bg-[#121722] border border-gray-700 text-amber-300 hover:border-[#D4AF37] hover:text-white transition-all flex items-center space-x-1"
                          >
                            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Assign Assets</span>
                          </button>
                        )}

                        {/* Delete User Button: Strictly Super Admin Only */}
                        {canCreateUser && !isKimAdmin && (
                          <button
                            onClick={() => onDeleteUser(user.id)}
                            title="Revoke User Access"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {!canAssignAssets && !canCreateUser && (
                          <span className="text-[10px] text-gray-500 font-mono">Read-Only</span>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className={`p-6 rounded-2xl border ${
        theme === 'dark' ? 'dream-card' : 'dream-card-light'
      }`}>
        <h3 className="font-cinzel text-sm font-bold text-white mb-3 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-[#D4AF37]" />
          <span>Role Capability Matrix</span>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-[10px] uppercase">
                <th className="pb-2">Capability</th>
                <th className="pb-2">Super Admin</th>
                <th className="pb-2">Account Manager</th>
                <th className="pb-2">Media Buyer</th>
                <th className="pb-2">Client / Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-sans text-xs">
              <tr>
                <td className="py-2.5 text-white font-medium">Create User ID & Password</td>
                <td className="py-2.5 text-emerald-400 font-bold font-mono">YES (Exclusive)</td>
                <td className="py-2.5 text-red-400/80 font-mono">NO</td>
                <td className="py-2.5 text-red-400/80 font-mono">NO</td>
                <td className="py-2.5 text-red-400/80 font-mono">NO</td>
              </tr>
              <tr>
                <td className="py-2.5 text-white font-medium">Assign & Delegate Assets</td>
                <td className="py-2.5 text-emerald-400 font-bold font-mono">YES</td>
                <td className="py-2.5 text-emerald-400 font-bold font-mono">YES</td>
                <td className="py-2.5 text-red-400/80 font-mono">NO</td>
                <td className="py-2.5 text-red-400/80 font-mono">NO</td>
              </tr>
              <tr>
                <td className="py-2.5 text-white font-medium">Delete / Revoke User Accounts</td>
                <td className="py-2.5 text-emerald-400 font-bold font-mono">YES</td>
                <td className="py-2.5 text-red-400/80 font-mono">NO</td>
                <td className="py-2.5 text-red-400/80 font-mono">NO</td>
                <td className="py-2.5 text-red-400/80 font-mono">NO</td>
              </tr>
              <tr>
                <td className="py-2.5 text-white font-medium">Modify Daily Budgets & Thresholds</td>
                <td className="py-2.5 text-emerald-400 font-bold font-mono">YES</td>
                <td className="py-2.5 text-emerald-400 font-bold font-mono">YES (Assigned)</td>
                <td className="py-2.5 text-emerald-400 font-bold font-mono">YES (Assigned)</td>
                <td className="py-2.5 text-gray-500 font-mono">NO (Read-Only)</td>
              </tr>
              <tr>
                <td className="py-2.5 text-white font-medium">Connect Pixels & API Tokens</td>
                <td className="py-2.5 text-emerald-400 font-bold font-mono">YES</td>
                <td className="py-2.5 text-gray-500 font-mono">NO</td>
                <td className="py-2.5 text-emerald-400 font-bold font-mono">YES</td>
                <td className="py-2.5 text-gray-500 font-mono">NO</td>
              </tr>
              <tr>
                <td className="py-2.5 text-white font-medium">Export CSV & Styled PDF Reports</td>
                <td className="py-2.5 text-emerald-400 font-bold font-mono">YES</td>
                <td className="py-2.5 text-emerald-400 font-bold font-mono">YES</td>
                <td className="py-2.5 text-emerald-400 font-bold font-mono">YES</td>
                <td className="py-2.5 text-emerald-400 font-bold font-mono">YES (Assigned)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Create User ID & Password (Strictly Super Admin) */}
      {showCreateModal && canCreateUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl my-8 rounded-2xl bg-[#0B0E14] border border-[#D4AF37]/40 p-6 text-white shadow-2xl">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div>
                <h3 className="font-cinzel text-base font-bold text-white flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                  <span>Create User ID & Password</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Super Admin Exclusive: Provision new credentials and assign initial assets
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="my-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    User ID / Username *
                  </label>
                  <input
                    id="new-user-id-input"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alex_buyer"
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Password *
                  </label>
                  <input
                    id="new-user-password-input"
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter secure password"
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Role & Permissions *
                  </label>
                  <select
                    id="new-user-role-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
                  >
                    <option value="media_buyer">Media Buyer (Manage assigned campaigns)</option>
                    <option value="account_manager">Account Manager (Budgets, Reports & Assign Assets)</option>
                    <option value="client_viewer">External Client / Viewer (Read-only)</option>
                    <option value="super_admin">Super Admin (Full Root Access)</option>
                  </select>
                </div>
              </div>

              {/* Asset Assignment Section */}
              {role !== 'super_admin' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Select Ad Accounts & Assets to Assign
                  </label>
                  {accounts.length === 0 ? (
                    <p className="text-xs text-gray-500 italic p-3 bg-[#121722] rounded-xl border border-gray-800">
                      No ad accounts currently created. You can assign assets later.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-[#121722] rounded-xl border border-gray-800">
                      {accounts.map(acc => {
                        const isSelected = selectedAssetIds.includes(acc.id);
                        return (
                          <label 
                            key={acc.id} 
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs"
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAssetSelection(acc.id)}
                                className="rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                              />
                              <span className="font-bold text-white">{acc.accountName}</span>
                              <span className="text-[10px] text-[#D4AF37] font-mono">({acc.clientName})</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 uppercase">
                              {acc.platform}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-create-user"
                  className="px-6 py-2.5 rounded-xl gold-btn text-xs font-bold uppercase tracking-wider"
                >
                  Create User & Grant Access
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Assign / Delegate Assets (Super Admin & Account Manager) */}
      {assigningUser && canAssignAssets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg my-8 rounded-2xl bg-[#0B0E14] border border-[#D4AF37]/40 p-6 text-white shadow-2xl">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div>
                <h3 className="font-cinzel text-base font-bold text-white flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#D4AF37]" />
                  <span>Assign Ad Assets to {assigningUser.name}</span>
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  User ID: <span className="text-[#F3E5AB]">{assigningUser.username}</span> • Role: <span className="uppercase text-amber-300">{assigningUser.role.replace('_', ' ')}</span>
                </p>
              </div>
              <button
                onClick={() => setAssigningUser(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-semibold">Client Ad Accounts & Pixels:</span>
                <span className="text-[11px] text-[#D4AF37] font-mono">
                  {tempAssignedAssets.length} Selected
                </span>
              </div>

              {accounts.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#121722] border border-gray-800 text-xs text-gray-400 text-center">
                  No ad accounts available to assign. Connect ad accounts first in the Ad Accounts module.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-[#121722] rounded-xl border border-gray-800">
                  {accounts.map(acc => {
                    const isSelected = tempAssignedAssets.includes(acc.id);
                    return (
                      <label 
                        key={acc.id} 
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer text-xs ${
                          isSelected 
                            ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-white' 
                            : 'bg-black/20 border-gray-800 text-gray-400 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTempAssetSelection(acc.id)}
                            className="rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                          />
                          <div>
                            <div className="font-bold text-white">{acc.accountName}</div>
                            <div className="text-[10px] text-gray-400 font-mono flex items-center space-x-2">
                              <span>Client: {acc.clientName}</span>
                              <span>•</span>
                              <span>Daily Budget: ${acc.dailyBudget.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#D4AF37] uppercase">
                          {acc.platform}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setAssigningUser(null)}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssetAssignment}
                className="px-6 py-2.5 rounded-xl gold-btn text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Asset Assignment</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};


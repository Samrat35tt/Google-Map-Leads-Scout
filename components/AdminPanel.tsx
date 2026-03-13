
import React, { useState, useEffect } from 'react';
import { AppUser } from '../types';
import { X, Search, UserPlus, Shield, Settings, Trash2, Mail, CreditCard, Calendar, Lock, AlertCircle, Edit2, LogIn, Ban, CheckCircle, Power } from 'lucide-react';

interface AdminPanelProps {
  currentUser: AppUser;
  onClose: () => void;
  onImpersonate?: (user: AppUser) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onClose, onImpersonate }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserCredits, setNewUserCredits] = useState(50);
  const [isCreating, setIsCreating] = useState(false);

  // Edit/Manage User Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
  const [editCredits, setEditCredits] = useState(0);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete User State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    
    await new Promise(r => setTimeout(r, 800));
    const demoUsers: AppUser[] = [
      { id: '1', email: 'admin@salesoxe.com', plan: 'agency', credits: 9999, isAdmin: true, created_at: new Date().toISOString(), suspended: false },
      { id: '2', email: 'client@company.com', plan: 'growth', credits: 450, created_at: new Date(Date.now() - 86400000).toISOString(), suspended: false },
      { id: '3', email: 'suspended@baduser.com', plan: 'free', credits: 0, created_at: new Date(Date.now() - 90000000).toISOString(), suspended: true },
    ];
    setUsers(demoUsers);
    
    setIsLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    await new Promise(r => setTimeout(r, 1000));
    const newUser: AppUser = {
        id: `created-${Date.now()}`,
        email: newUserEmail,
        plan: 'free',
        credits: newUserCredits,
        created_at: new Date().toISOString(),
        suspended: false
    };
    setUsers([newUser, ...users]);
    setShowCreateModal(false);

    setIsCreating(false);
  };

  const openEditModal = (user: AppUser) => {
      setUserToEdit(user);
      setEditCredits(user.credits || 0);
      setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
      if (!userToEdit) return;
      setIsSavingEdit(true);

      await new Promise(r => setTimeout(r, 500));
      setUsers(users.map(u => u.id === userToEdit.id ? { ...u, credits: editCredits } : u));
      setShowEditModal(false);
      setUserToEdit(null);
      setIsSavingEdit(false);
  };

  const handleToggleSuspend = async (targetUser: AppUser) => {
      const newStatus = !targetUser.suspended;
      
      // If called from modal, set saving state there
      if (userToEdit && userToEdit.id === targetUser.id) setIsSavingEdit(true);

      // Demo mode
      await new Promise(r => setTimeout(r, 300));
      const updated = { ...targetUser, suspended: newStatus };
      setUsers(prev => prev.map(u => u.id === targetUser.id ? updated : u));
      if (userToEdit && userToEdit.id === targetUser.id) {
          setUserToEdit(updated);
      }
      
      if (userToEdit && userToEdit.id === targetUser.id) setIsSavingEdit(false);
  };

  const confirmDelete = (user: AppUser) => {
    setUserToDelete(user);
    setAdminPassword('');
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToDelete) return;
    setIsDeleting(true);

    await new Promise(r => setTimeout(r, 1000));
    if (adminPassword !== 'admin123' && adminPassword !== 'password') { 
         alert("Incorrect password (Try 'password' or 'admin123' in demo mode)");
         setIsDeleting(false);
         return;
    }
    setUsers(users.filter(u => u.id !== userToDelete!.id));
    setShowDeleteModal(false);
    setUserToDelete(null);
    setAdminPassword('');
    
    setIsDeleting(false);
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-[#f0f9ff] z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
      
      {/* Top Bar */}
      <div className="bg-white border-b border-[#e0f2fe] px-6 py-4 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#0f172a] rounded-full flex items-center justify-center text-white">
                 <Shield size={20} />
             </div>
             <div>
                 <h1 className="text-xl font-normal text-[#1f1f1f]">SalesOxe Admin</h1>
                 <p className="text-xs text-[#444746]">Managing access for {users.length} accounts</p>
             </div>
         </div>
         <button onClick={onClose} className="p-2 hover:bg-[#f0f9ff] rounded-full transition-colors text-[#444746]">
             <X size={24} />
         </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
         <div className="max-w-7xl mx-auto">
             
             {/* Toolbar */}
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                 <div className="relative w-full md:w-96">
                     <Search className="absolute left-4 top-3 text-[#444746]" size={18} />
                     <input 
                       type="text" 
                       placeholder="Search users by email..." 
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0f2fe] rounded-full text-sm focus:outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a]"
                     />
                 </div>
                 <button 
                   onClick={() => setShowCreateModal(true)}
                   className="bg-[#0f172a] text-white px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 hover:bg-[#1e293b] transition-all shadow-sm"
                 >
                     <UserPlus size={18} />
                     Create Account
                 </button>
             </div>

             {/* User Table */}
             <div className="bg-white rounded-[24px] border border-[#e0f2fe] overflow-hidden shadow-sm">
                 <table className="min-w-full divide-y divide-[#e0f2fe]">
                     <thead className="bg-[#f0f9ff]">
                         <tr>
                             <th className="px-6 py-4 text-left text-xs font-bold text-[#444746] uppercase tracking-wider">User</th>
                             <th className="px-6 py-4 text-left text-xs font-bold text-[#444746] uppercase tracking-wider">Plan</th>
                             <th className="px-6 py-4 text-left text-xs font-bold text-[#444746] uppercase tracking-wider">Credits</th>
                             <th className="px-6 py-4 text-left text-xs font-bold text-[#444746] uppercase tracking-wider">Status</th>
                             <th className="px-6 py-4 text-right text-xs font-bold text-[#444746] uppercase tracking-wider">Actions</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-[#e0f2fe]">
                         {isLoading ? (
                             <tr>
                                 <td colSpan={5} className="px-6 py-12 text-center text-[#444746]">
                                     Loading users...
                                 </td>
                             </tr>
                         ) : filteredUsers.length === 0 ? (
                             <tr>
                                 <td colSpan={5} className="px-6 py-12 text-center text-[#444746]">
                                     No users found matching "{searchTerm}"
                                 </td>
                             </tr>
                         ) : (
                             filteredUsers.map((user) => (
                                 <tr key={user.id} className="hover:bg-[#f0f9ff] transition-colors">
                                     <td className="px-6 py-4 whitespace-nowrap">
                                         <div className="flex items-center gap-3">
                                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.suspended ? 'bg-red-100 text-red-700' : 'bg-[#e0f2fe] text-[#0284c7]'}`}>
                                                 {user.email.charAt(0).toUpperCase()}
                                             </div>
                                             <div className="flex flex-col">
                                                 <span className="text-sm font-medium text-[#1f1f1f] flex items-center gap-2">
                                                     {user.email}
                                                     {user.isAdmin && <span className="px-1.5 py-0.5 bg-[#b3261e] text-white text-[10px] rounded uppercase">Admin</span>}
                                                 </span>
                                                 <span className="text-xs text-[#444746]">{user.id.substring(0, 8)}...</span>
                                             </div>
                                         </div>
                                     </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                                         <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${
                                             user.plan === 'agency' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                             user.plan === 'growth' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                             'bg-gray-50 text-gray-600 border-gray-200'
                                         }`}>
                                             {user.plan}
                                         </span>
                                     </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                                         <div className="flex items-center gap-1.5 text-sm font-medium text-[#1f1f1f]">
                                             <CreditCard size={14} className="text-[#444746]" />
                                             {user.credits?.toLocaleString() || 0}
                                         </div>
                                     </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                                         {user.suspended ? (
                                             <span className="flex items-center gap-1.5 text-xs font-medium text-[#b3261e] bg-red-50 px-2 py-1 rounded-full w-fit">
                                                 <Ban size={12} /> Suspended
                                             </span>
                                         ) : (
                                             <span className="flex items-center gap-1.5 text-xs font-medium text-[#188038] bg-green-50 px-2 py-1 rounded-full w-fit">
                                                 <CheckCircle size={12} /> Active
                                             </span>
                                         )}
                                     </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-right">
                                         <div className="flex justify-end gap-2">
                                             {!user.isAdmin && (
                                                <>
                                                    <button 
                                                        onClick={() => handleToggleSuspend(user)}
                                                        className={`p-2 rounded-full transition-colors ${user.suspended ? 'text-[#188038] hover:bg-green-50' : 'text-[#b3261e] hover:bg-red-50'}`}
                                                        title={user.suspended ? "Activate Account" : "Suspend Account"}
                                                    >
                                                        {user.suspended ? <CheckCircle size={16} /> : <Ban size={16} />}
                                                    </button>
                                                    <button 
                                                        onClick={() => onImpersonate?.(user)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0284c7] bg-[#e0f2fe] rounded-full hover:bg-[#bae6fd] transition-colors"
                                                        title="Login as this user"
                                                    >
                                                        <LogIn size={14} /> Access
                                                    </button>
                                                    <button 
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2 text-[#444746] hover:bg-[#e0f2fe] rounded-full transition-colors" 
                                                        title="Manage User & Credits"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => confirmDelete(user)}
                                                        className="p-2 text-[#b3261e] hover:bg-[#fce8e6] rounded-full transition-colors" 
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                             )}
                                         </div>
                                     </td>
                                 </tr>
                             ))
                         )}
                     </tbody>
                 </table>
             </div>
         </div>
      </div>

      {/* Edit User Modal (Credits & Suspension) */}
      {showEditModal && userToEdit && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
             <div className="bg-white rounded-[24px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                 <div className="p-6 border-b border-[#e0f2fe] flex justify-between items-center">
                    <h3 className="text-lg font-medium text-[#1f1f1f]">Manage User</h3>
                    <button onClick={() => setShowEditModal(false)}><X size={20} className="text-[#444746]" /></button>
                 </div>
                 <div className="p-6 space-y-6">
                     <div className="space-y-2">
                         <label className="text-xs font-medium text-[#444746]">Credit Balance</label>
                         <div className="flex items-center gap-3">
                             <input 
                               type="number" 
                               className="flex-1 px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm focus:ring-2 focus:ring-[#0f172a]/20 outline-none font-bold text-[#0f172a]"
                               value={editCredits}
                               onChange={e => setEditCredits(parseInt(e.target.value) || 0)}
                             />
                         </div>
                         <p className="text-xs text-[#444746]">Manually adjust credits for this account.</p>
                     </div>

                     <div className="space-y-2 pt-2 border-t border-[#f0f9ff]">
                         <label className="text-xs font-medium text-[#444746]">Account Status</label>
                         <div className="flex items-center justify-between p-3 bg-[#f0f9ff] rounded-xl">
                            <span className={`text-sm font-medium ${userToEdit.suspended ? 'text-[#b3261e]' : 'text-[#188038]'}`}>
                                {userToEdit.suspended ? 'Suspended' : 'Active'}
                            </span>
                            <button 
                                onClick={() => handleToggleSuspend(userToEdit)}
                                disabled={isSavingEdit}
                                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                                    userToEdit.suspended 
                                    ? 'bg-[#188038] text-white hover:bg-[#188038]/90' 
                                    : 'bg-[#b3261e] text-white hover:bg-[#b3261e]/90'
                                }`}
                            >
                                {userToEdit.suspended ? 'Activate' : 'Suspend'}
                            </button>
                         </div>
                     </div>
                     
                     <div className="pt-4 flex gap-3">
                         <button 
                            onClick={() => handleSaveEdit()}
                            disabled={isSavingEdit}
                            className="w-full py-2.5 bg-[#0f172a] text-white rounded-full font-medium text-sm hover:bg-[#1e293b] transition-all shadow-sm"
                         >
                             {isSavingEdit ? 'Saving...' : 'Save Changes'}
                         </button>
                     </div>
                 </div>
             </div>
          </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
              <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                  <div className="p-6 border-b border-[#e0f2fe] flex justify-between items-center">
                      <h3 className="text-lg font-medium text-[#1f1f1f]">Manually Create User</h3>
                      <button onClick={() => setShowCreateModal(false)}><X size={20} className="text-[#444746]" /></button>
                  </div>
                  
                  <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs font-medium text-[#444746]">Email Address</label>
                          <div className="relative">
                              <Mail className="absolute left-3 top-2.5 text-[#444746]" size={16} />
                              <input 
                                type="email" 
                                required
                                className="w-full pl-10 pr-4 py-2 bg-[#f0f9ff] rounded-lg text-sm focus:ring-2 focus:ring-[#0f172a]/20 outline-none"
                                value={newUserEmail}
                                onChange={e => setNewUserEmail(e.target.value)}
                              />
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-medium text-[#444746]">Temporary Password</label>
                          <input 
                            type="password" 
                            required
                            className="w-full px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm focus:ring-2 focus:ring-[#0f172a]/20 outline-none"
                            value={newUserPassword}
                            onChange={e => setNewUserPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-medium text-[#444746]">Starting Credits</label>
                          <input 
                            type="number" 
                            required
                            className="w-full px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm focus:ring-2 focus:ring-[#0f172a]/20 outline-none"
                            value={newUserCredits}
                            onChange={e => setNewUserCredits(parseInt(e.target.value))}
                          />
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button 
                            type="button" 
                            onClick={() => setShowCreateModal(false)}
                            className="flex-1 py-2.5 text-sm font-medium text-[#444746] hover:bg-[#f0f9ff] rounded-full transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                            type="submit"
                            disabled={isCreating}
                            className="flex-1 py-2.5 text-sm font-medium bg-[#0f172a] text-white rounded-full hover:bg-[#1e293b] transition-colors shadow-sm disabled:opacity-70"
                          >
                              {isCreating ? 'Creating...' : 'Create Account'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
             <div className="bg-white rounded-[24px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                 <div className="p-6 text-center">
                     <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                         <AlertCircle size={24} className="text-[#b3261e]" />
                     </div>
                     <h3 className="text-lg font-medium text-[#1f1f1f] mb-2">Delete User?</h3>
                     <p className="text-sm text-[#444746] mb-6">
                        This will permanently remove <strong>{userToDelete.email}</strong> from the database. This action cannot be undone.
                     </p>
                     
                     <form onSubmit={handleDeleteUser} className="text-left space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[#444746]">Confirm Admin Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 text-[#444746]" size={16} />
                                <input 
                                    type="password" 
                                    required
                                    autoFocus
                                    className="w-full pl-10 pr-4 py-2 bg-[#f0f9ff] rounded-lg text-sm focus:ring-2 focus:ring-[#b3261e]/20 outline-none border border-transparent focus:border-[#b3261e]"
                                    value={adminPassword}
                                    onChange={e => setAdminPassword(e.target.value)}
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>
                        
                        <div className="pt-2 flex gap-3">
                             <button 
                                type="button" 
                                onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}
                                className="flex-1 py-2.5 text-sm font-medium text-[#444746] hover:bg-[#f0f9ff] rounded-full transition-colors"
                             >
                                 Cancel
                             </button>
                             <button 
                                type="submit"
                                disabled={isDeleting}
                                className="flex-1 py-2.5 text-sm font-medium bg-[#b3261e] text-white rounded-full hover:bg-[#b3261e]/90 transition-colors shadow-sm disabled:opacity-70"
                             >
                                 {isDeleting ? 'Deleting...' : 'Delete User'}
                             </button>
                        </div>
                     </form>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default AdminPanel;

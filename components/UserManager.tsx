import React, { useState, useEffect } from 'react';
import { User } from '../services/storageService';
import { House } from '../types';
import * as storage from '../services/storageService';
import { Crown, Plus, Trash2, Sparkles } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface UserManagerProps {
  onUserChange: () => void;
}

const UserManager: React.FC<UserManagerProps> = ({ onUserChange }) => {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadUsers = () => {
    setUsers(storage.getUsers());
    setCurrentUser(storage.getCurrentUser());
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = () => {
    const trimmed = newUsername.trim();
    if (!trimmed) return;

    if (storage.userExists(trimmed)) {
      soundEffects.playError();
      alert('User already exists!');
      return;
    }

    const success = storage.createUser(trimmed);
    if (success) {
      soundEffects.playNotification();
      setNewUsername('');
      setShowCreateForm(false);
      loadUsers();
      onUserChange();
    }
  };

  const handleSwitchUser = (username: string) => {
    if (username === currentUser) return;

    soundEffects.playButtonClick();
    const success = storage.switchUser(username);
    if (success) {
      loadUsers();
      onUserChange();
    }
  };

  const handleDeleteUser = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Delete user "${username}"? All progress will be lost!`)) return;

    soundEffects.playSpellFail();
    const success = storage.deleteUser(username);
    if (success) {
      loadUsers();
      onUserChange();
    }
  };

  return (
    <div className="mystical-card max-w-md mx-auto p-8 space-y-6 float-animation">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Crown size={28} className="text-amber-500" />
          <h2 className="text-2xl font-magic shimmer-text">
            Choose Your Wizard
          </h2>
        </div>
        <p className="text-sm text-gray-400">
          Select an existing wizard or create a new one to begin your magical journey
        </p>
      </div>

      {/* Current User */}
      {currentUser && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30">
          <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1">Current Wizard</p>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400" />
            <span className="text-lg font-magic text-emerald-300">{currentUser}</span>
          </div>
        </div>
      )}

      {/* Create New User Button */}
      {!showCreateForm ? (
        <button
          onClick={() => {
            soundEffects.playButtonClick();
            setShowCreateForm(true);
          }}
          className="mystical-btn w-full"
        >
          <Plus size={18} />
          <span>Create New Wizard</span>
        </button>
      ) : (
        <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-500/30">
          <p className="text-sm text-purple-300 mb-2">Enter Wizard Name</p>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateUser()}
            placeholder="e.g., HarryPotter"
            className="mystical-input"
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreateUser}
              disabled={!newUsername.trim()}
              className="mystical-btn flex-1"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewUsername('');
              }}
              className="mystical-btn flex-1"
              style={{ background: 'rgba(60, 60, 70, 0.5)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* User List */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Select Wizard ({Object.keys(users).length})
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {Object.values(users).map((user) => (
            <div
              key={user.username}
              onClick={() => handleSwitchUser(user.username)}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between group ${
                user.username === currentUser
                  ? 'bg-emerald-900/30 border-emerald-500/50 shadow-lg shadow-emerald-900/20'
                  : 'bg-purple-900/10 border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-900/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                  user.username === currentUser
                    ? 'bg-emerald-600 text-white'
                    : 'bg-purple-800/50 text-purple-300'
                }`}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`font-magic ${
                    user.username === currentUser ? 'text-emerald-300' : 'text-gray-300'
                  }`}>
                    {user.username}
                    {user.username === currentUser && (
                      <span className="ml-2 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.progress.graduated ? 'Graduated' : `Level ${user.progress.maxLevel}`} • {user.progress.house !== House.Unsorted ? user.progress.house : 'Unsorted'}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteUser(user.username, e)}
                className="p-2 text-red-400 hover:bg-red-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Delete user"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {Object.keys(users).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No wizards found</p>
              <p className="text-xs mt-1">Create a new wizard to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManager;

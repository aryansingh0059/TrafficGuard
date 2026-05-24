import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user:  JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || 'null'),
  token: sessionStorage.getItem('token') || localStorage.getItem('token') || null,

  // Convenience getter — derived from user.role
  get role() {
    return this.user?.role ?? null;
  },

  login: (userData, token, remember = false) => {
    const storage = remember ? localStorage : sessionStorage;
    
    // Clear the opposite storage to prevent mixed state
    const oppositeStorage = remember ? sessionStorage : localStorage;
    oppositeStorage.removeItem('token');
    oppositeStorage.removeItem('user');

    storage.setItem('token', token);
    storage.setItem('user',  JSON.stringify(userData));
    set({ user: userData, token });
  },

  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;

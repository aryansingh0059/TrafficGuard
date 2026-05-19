import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user:  JSON.parse(localStorage.getItem('user'))  || null,
  token: localStorage.getItem('token') || null,

  // Convenience getter — derived from user.role
  get role() {
    return this.user?.role ?? null;
  },

  login: (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user',  JSON.stringify(userData));
    set({ user: userData, token });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;

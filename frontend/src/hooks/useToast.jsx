import { createContext, useContext, useState, useCallback } from 'react';
import GovToast from '../components/GovToast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = {
    success: (title, message) => addToast('success', title, message),
    error: (title, message) => addToast('error', title, message),
    warning: (title, message) => addToast('warning', title, message),
    info: (title, message) => addToast('info', title, message),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div
        aria-live="assertive"
        className="fixed inset-0 z-[9999] flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-end gap-3"
      >
        {toasts.map(t => (
          <GovToast
            key={t.id}
            id={t.id}
            type={t.type}
            title={t.title}
            message={t.message}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

import { useState, useEffect } from 'react';

const GovToast = ({ id, type, title, message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slight delay to trigger slide-in animation
    requestAnimationFrame(() => setIsVisible(true));
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Wait for slide-out animation to finish before removing
    }, 4000); // 4 seconds auto-dismiss

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  const types = {
    success: { border: 'border-[#2e7d32]', icon: 'text-[#2e7d32]', svg: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> },
    error: { border: 'border-[#b71c1c]', icon: 'text-[#b71c1c]', svg: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> },
    warning: { border: 'border-[#d4a017]', icon: 'text-[#d4a017]', svg: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
    info: { border: 'border-primary', icon: 'text-primary', svg: <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  };

  const style = types[type] || types.info;

  return (
    <div 
      className={`pointer-events-auto w-full max-w-sm bg-white shadow-lg rounded pointer-events-auto border border-border border-l-4 ${style.border} transition-all duration-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="p-4 flex items-start gap-3">
        <div className={`shrink-0 ${style.icon}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {style.svg}
          </svg>
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-[13px] font-bold text-gray-900">{title}</p>
          <p className="mt-1 text-[12px] text-gray-600 font-medium">{message}</p>
        </div>
        <div className="shrink-0 flex ml-4">
          <button
            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            onClick={handleClose}
            aria-label="Close Notification"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GovToast;

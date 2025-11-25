import React, { createContext, useContext, useState, ReactNode } from 'react';
import ToastNotification from '../components/ToastNotification';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  id: string;
  type: ToastType;
  message: string;
  position?: 'top' | 'bottom';
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, position?: 'top' | 'bottom', duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<ToastConfig | null>(null);

  const showToast = (
    type: ToastType, 
    message: string, 
    position: 'top' | 'bottom' = 'top', 
    duration: number = 3000
  ) => {
    // Hide current toast if any
    setCurrentToast(null);
    
    // Show new toast after a brief delay
    setTimeout(() => {
      setCurrentToast({
        id: Date.now().toString(),
        type,
        message,
        position,
        duration,
      });
    }, 100);
  };

  const hideToast = () => {
    setCurrentToast(null);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {currentToast && (
        <ToastNotification
          visible={!!currentToast}
          type={currentToast.type}
          message={currentToast.message}
          position={currentToast.position}
          duration={currentToast.duration}
          onHide={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
};

import { Toaster } from "react-hot-toast";

const GlobalToaster = () => {
  return (
    <Toaster 
      position="top-right"
      containerStyle={{ zIndex: 999999, top: 24, right: 24 }}
      toastOptions={{
        className: '',
        style: {
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '0.875rem', // 14px
          fontWeight: '500',
          maxWidth: '400px'
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        },
      }}
    />
  );
};

export default GlobalToaster;

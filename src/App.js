import React, { useEffect } from 'react';
import AppRoutes from './routes';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'sweetalert2/dist/sweetalert2.min.css';

function App() {
  useEffect(() => {
    const desbloquear = () => {
      document.body.style.pointerEvents = "auto";
  
      const overlays = document.querySelectorAll("*");
      overlays.forEach((el) => {
        const styles = window.getComputedStyle(el);
        const z = parseInt(styles.zIndex, 10);
        const pe = styles.pointerEvents;
  
        const esSweetAlert = el.classList.contains("swal2-container");
  
        if (
          !esSweetAlert &&
          (pe === "all" || pe === "auto") &&
          z >= 1000 &&
          styles.position === "fixed"
        ) {
          el.parentNode?.removeChild(el);
        }
      });
    };
  
    desbloquear();
    const observer = new MutationObserver(() => desbloquear());
    observer.observe(document.body, { childList: true, subtree: true });
  
    return () => observer.disconnect();
  }, []);
  

  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </AuthProvider>
  );
}

export default App;

import { Navigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { withLocalePath } from '../utils/localeRoutes';

/**
 * ProtectedRoute - Bảo vệ route yêu cầu đăng nhập
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component con cần render
 * @param {string} props.requiredUserType - Loại user: 'ctv' | 'admin' | 'business'
 */
const ProtectedRoute = ({ children, requiredUserType }) => {
  const { language } = useLanguage();
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  const collaboratorLogin = withLocalePath(language, '/collaborator/login');

  if (!token || !userType) {
    if (requiredUserType === 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
    if (requiredUserType === 'business') {
      return <Navigate to="/business/login" replace />;
    }
    return <Navigate to={collaboratorLogin} replace />;
  }

  if (requiredUserType && userType !== requiredUserType) {
    if (userType === 'ctv') {
      return <Navigate to="/agent" replace />;
    }
    if (userType === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (userType === 'business') {
      return <Navigate to="/business" replace />;
    }
    if (requiredUserType === 'business') {
      return <Navigate to="/business/login" replace />;
    }
    if (requiredUserType === 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to={collaboratorLogin} replace />;
  }

  return children;
};

export default ProtectedRoute;


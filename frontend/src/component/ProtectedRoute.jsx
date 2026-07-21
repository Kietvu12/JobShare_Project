import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute - Bảo vệ route yêu cầu đăng nhập
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component con cần render
 * @param {string} props.requiredUserType - Loại user: 'ctv' | 'admin' | 'business'
 */
const ProtectedRoute = ({ children, requiredUserType }) => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  if (!token || !userType) {
    if (requiredUserType === 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
    if (requiredUserType === 'business') {
      return <Navigate to="/business/login" replace />;
    }
    return <Navigate to="/login" replace />;
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
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;


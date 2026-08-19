import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element }) => {
  const { isAuthenticated, currentUser, globalSettings } = useSelector((state) => state.store);
  const isAdmin = currentUser?.email === "balajiaadi2000@gmail.com" || 
                  currentUser?.userRole?.name?.toLowerCase() === "admin" ||
                  currentUser?.role === "admin";
  const isPaidUser = currentUser?.subscriptionType !== 'free';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If global mode is paid, and user is not admin and hasn't paid, force pricing page
  if (globalSettings?.subscriptionType === 'paid' && !isAdmin && !isPaidUser && window.location.pathname !== '/pricing') {
    return <Navigate to="/pricing" replace />;
  }

  return element;
};

export default ProtectedRoute;

export const PublicRoute = ({ element }) => {
  const { isAuthenticated } = useSelector((state) => state.store);

  return isAuthenticated ? <Navigate to="/" replace /> : element;
};

import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element }) => {
  const { isAuthenticated } = useSelector((state) => state.store);

  console.log("isAuthenticated>>", isAuthenticated);

  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

export const PublicRoute = ({ element }) => {
  const { isAuthenticated } = useSelector((state) => state.store);

  return isAuthenticated ? <Navigate to="/" replace /> : element;
};

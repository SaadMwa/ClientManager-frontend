// ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/authContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  console.log("🔵 ProtectedRoute - loading:", loading);
  console.log("🔵 ProtectedRoute - user:", user);

  if (loading) {
    console.log("🔵 Still loading, showing loading screen");
    return <p>Loading...</p>;
  }
  
  if (!user) {
    console.log("🔵 No user, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("🔵 User found, showing protected page");
  return children;
};

export default ProtectedRoute;
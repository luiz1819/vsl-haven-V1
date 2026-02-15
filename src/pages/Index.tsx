import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";

const Index = () => {
  const { session, loading } = useAuth();

  if (loading) return null;
  return <Navigate to={session ? "/dashboard" : "/login"} replace />;
};

export default Index;

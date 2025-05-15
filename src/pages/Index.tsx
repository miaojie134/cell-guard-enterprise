
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (isLoading) return;
    
    console.log("Index page auth check:", { isAuthenticated, isLoading });
    if (isAuthenticated) {
      console.log("Authenticated, redirecting to dashboard");
      navigate("/dashboard");
    } else {
      console.log("Not authenticated, redirecting to login");
      navigate("/login");
    }
  }, [navigate, isAuthenticated, isLoading]);
  
  return null;
};

export default Index;

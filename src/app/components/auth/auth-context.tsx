"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authAPI } from "@/app/services/api";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePic?: string;
  role: "USER" | "HOTEL_OWNER";
  hotels?: string[];
};

type SignupData = Omit<User, "id"> & { password: string };

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHotelOwner: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Omit<User, "id"> & { password: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default user
const DEFAULT_USER: User = {
  id: "1",
  email: "john.doe@example.com",
  firstName: "John",
  lastName: "Doe",
  phone: "+1 (555) 123-4567",
  profilePic: "/placeholder.svg?height=200&width=200",
  role: "USER",
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // Check for token in localStorage
        const token = localStorage.getItem("token");
        //  console.log(token)
        if (token) {
          authAPI
            .getProfile()
            .then((response) => {
              //console.log('User profile fetched:', response);
              setUser(response.user);
            })
            .catch((error) => {
              console.error("Failed to fetch user profile", error);
            })
            .finally(() => setIsLoading(false));
        } else {
          // For frontend testing purposes, set default user
          //setUser(DEFAULT_USER)
          throw new Error("User token unavaliable");
        }
      } catch (error) {
        //console.error("Auth initialization error:", error)
        // For frontend testing purposes, set default user on error
        // setUser(DEFAULT_USER)
        // setApiAvailable(false)
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Destructure the accessToken and refreshToken from the response
      const { user, accessToken, refreshToken } = await authAPI.login(
        email,
        password
      );

      // console.log("accessToken:", accessToken); // Log the accessToken to confirm it's returned
      // console.log("refreshToken:", refreshToken); // Log the refreshToken to confirm it's returned

      if (typeof window !== "undefined") {
        // Store both tokens in localStorage
        localStorage.setItem("token", accessToken); // Store the accessToken for API calls
        localStorage.setItem("refreshToken", refreshToken); // Store the refreshToken for token renewal
      }

      setUser(user); // Store user info in state
    } catch (error) {
      console.error("Login error:", error);
      throw new Error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: Omit<User, "id"> & { password: string }) => {
    setIsLoading(true);
    try {
      try {
        //console.log(userData)
        const { user, token } = await authAPI.signup(userData);

        // Save token to localStorage
        localStorage.setItem("token", token);

        // Save user to state
        setUser(user);
      } catch (error) {
        throw new Error("Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem("token");

    // Clear user from state
    setUser(null);
  };

  const updateProfile = async (userData: Partial<User>) => {
    setIsLoading(true);
    //console.log("Token in localStorage:", localStorage.getItem("token"));

    try {
      const { user: updatedUser } = await authAPI.updateProfile(userData); // This will send the token with the request

      // Update user in state
      setUser((prevUser) =>
        prevUser ? { ...prevUser, ...updatedUser } : null
      );
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    if (!user) return;

    try {
      const response = await authAPI.getProfile();
      if (response && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error("Failed to refresh user profile", error);
    }
  };

  //console.log(user)
  const contextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isHotelOwner: user?.role === "HOTEL_OWNER",
    login,
    signup,
    logout,
    updateProfile,
    refreshUserProfile,
  };
  //(contextValue.isAuthenticated)
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
    //console.log("NO")
  }
  //console.log("context: "+ context.isAuthenticated)
  return context;
};

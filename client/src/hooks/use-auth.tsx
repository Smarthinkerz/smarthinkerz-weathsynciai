import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type LoginData = (Pick<InsertUser, "username" | "password"> | {email: string, password: string});
type CompanyLoginData = { email: string; password: string };
type Company = {
  id: number;
  name: string;
  email?: string; // This will come from primaryContactEmail
  primaryContactEmail: string;
  verificationStatus: string | null;
  subscriptionTier?: string;
  description: string;
  profileVideo?: string | null;
};

type AuthContextType = {
  user: SelectUser | null;
  company: Company | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  companyAuth: {
    loginMutation: UseMutationResult<Company, Error, CompanyLoginData>;
    registerMutation: UseMutationResult<Company, Error, any>;
  };
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: company } = useQuery<Company | undefined, Error>({
    queryKey: ["/api/company"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username, email, or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: "Welcome to WealthSync AI!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const companyLoginMutation = useMutation({
    mutationFn: async (credentials: CompanyLoginData) => {
      const res = await apiRequest("POST", "/api/company/login", credentials);
      return await res.json();
    },
    onSuccess: (company: Company) => {
      queryClient.setQueryData(["/api/company"], company);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const companyRegisterMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/company/register", data);
      return await res.json();
    },
    onSuccess: (company: Company) => {
      queryClient.setQueryData(["/api/company"], company);
      toast({
        title: "Registration successful",
        description: "Welcome to WealthSync AI!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create company account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Determine if we're logging out a user or company
      if (user) {
        await apiRequest("POST", "/api/logout");
      } else if (company) {
        await apiRequest("POST", "/api/company/logout");
      }
    },
    onSuccess: () => {
      // Clear both user and company data
      queryClient.setQueryData(["/api/user"], null);
      queryClient.setQueryData(["/api/company"], null);
      toast({
        title: "Logged out",
        description: "Successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        company: company ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        companyAuth: {
          loginMutation: companyLoginMutation,
          registerMutation: companyRegisterMutation,
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
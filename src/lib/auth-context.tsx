"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface AuthContextType {
  clientId: Id<"clients"> | null;
  client: any | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    company: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState<Id<"clients"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const client = useQuery(
    api.clients.get,
    clientId ? { clientId } : "skip"
  );

  const createClient = useMutation(api.clients.create);

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("rg_client_id");
    if (stored) {
      setClientId(stored as Id<"clients">);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    // Query by email -- this is a simple lookup, no password check for now
    // In production you'd add proper auth
    const stored = localStorage.getItem("rg_client_id");
    if (stored) {
      setClientId(stored as Id<"clients">);
    }
  };

  const signup = async (
    name: string,
    email: string,
    company: string,
    password: string
  ) => {
    const id = await createClient({ name, email, company, password });
    localStorage.setItem("rg_client_id", id);
    setClientId(id);
  };

  const logout = () => {
    localStorage.removeItem("rg_client_id");
    setClientId(null);
  };

  return (
    <AuthContext.Provider
      value={{ clientId, client, isLoading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPhoneVerification: (
    phoneNumber: string,
  ) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneOTP: (
    phoneNumber: string,
    token: string,
  ) => Promise<{ success: boolean; error?: string }>;
  phoneSession: { phoneNumber: string | null; verified: boolean };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneSession, setPhoneSession] = useState<{
    phoneNumber: string | null;
    verified: boolean;
  }>({
    phoneNumber: null,
    verified: false,
  });

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const sendPhoneVerification = async (phoneNumber: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) {
        console.error("Error sending verification code:", error);
        return { success: false, error: error.message };
      }

      setPhoneSession((prev) => ({ ...prev, phoneNumber }));
      return { success: true };
    } catch (error) {
      console.error("Error sending verification code:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const verifyPhoneOTP = async (phoneNumber: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token,
        type: "sms",
      });

      if (error) {
        console.error("Error verifying code:", error);
        return { success: false, error: error.message };
      }

      // If verification is successful, update the phone session
      setPhoneSession({ phoneNumber, verified: true });

      // If there's a user returned, update the user state
      if (data.user) {
        setUser(data.user);
      }

      return { success: true };
    } catch (error) {
      console.error("Error verifying code:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        sendPhoneVerification,
        verifyPhoneOTP,
        phoneSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

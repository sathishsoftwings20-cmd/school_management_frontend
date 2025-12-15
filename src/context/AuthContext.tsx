// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api, { setAuthToken } from "../api/api";

type User = { id: string; fullName?: string; role?: string; email?: string } | null;

type AuthContextType = {
    user: User;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string, remember?: boolean) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
    const [user, setUser] = useState<User>(() => {
        const s = localStorage.getItem("user");
        return s ? JSON.parse(s) : null;
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setAuthToken(token ?? null);
    }, [token]);

    const login = async (email: string, password: string, remember = false) => {
        setLoading(true);
        try {
            const res = await api.post("/auth/login", { email, password });
            const { token: newToken, user: u } = res.data;
            setToken(newToken);
            setUser(u);
            // store depending on remember
            if (remember) {
                localStorage.setItem("token", newToken);
                localStorage.setItem("user", JSON.stringify(u));
            } else {
                sessionStorage.setItem("token", newToken);
                sessionStorage.setItem("user", JSON.stringify(u));
            }
            setAuthToken(newToken);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        setAuthToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};

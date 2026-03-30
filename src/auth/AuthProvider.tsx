import React from "react";
import { clearToken, isExpired, loadAuth, saveToken, type AuthState } from "./authStore";

type AuthContextValue = AuthState & {
    setToken: (token: string) => void;
    logout: () => void;
    refresh: () => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = React.useState<AuthState>(() => loadAuth());

    const refresh = React.useCallback(() => setState(loadAuth()), []);

    const setToken = React.useCallback((token: string) => {
        saveToken(token);
        setState(loadAuth());
    }, []);

    const logout = React.useCallback(() => {
        clearToken();
        setState(loadAuth());
    }, []);

    React.useEffect(() => {
        if (state.token && isExpired(state)) logout();
    }, [state, logout]);

    return (
        <AuthContext.Provider value={{ ...state, setToken, logout, refresh }
        }>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = React.useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

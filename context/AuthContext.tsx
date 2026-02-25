import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {privateAxios, setAccessToken} from "@/api";

export type AuthUser = {
    username: string;
};

export type AuthState = {
    user: AuthUser | null;
    currentWorkspace: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (user: AuthUser) => void;
    logout: () => void;
    setCurrentWorkspace: (id: string | null) => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider(props: {children: ReactNode}) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!currentWorkspace) return;
        window.localStorage.setItem("currentWorkspace", currentWorkspace);
    }, [currentWorkspace])

    useEffect(() => {
        let active = true;
        if (typeof window !== "undefined") {
            const stored = window.localStorage.getItem("accessToken");
            if (stored) setAccessToken(stored);
            const storedWorkspace = window.localStorage.getItem("currentWorkspace");
            if (storedWorkspace) setCurrentWorkspace(storedWorkspace);
        }
        const loadUser = async () => {
            try {
                const response = await privateAxios.get("/user/me");
                const body = response.data;
                const username = body && (body.username as string | undefined);
                if (!active) return;
                if (!username) {
                    setUser(null);
                    setLoading(false);
                    return;
                }
                setUser({username});
                setLoading(false);
            } catch (e) {
                if (!active) return;
                setUser(null);
                setLoading(false);
            }
        };
        loadUser().then(r => {});
        return () => {
            active = false;
        };
    }, []);

    const login = (nextUser: AuthUser) => {
        setUser(nextUser);
    };

    const logout = () => {
        setUser(null);
        if (typeof window !== "undefined") window.localStorage.removeItem("accessToken");
        setAccessToken(null);
    };

    const value: AuthState = {
        user,
        currentWorkspace: currentWorkspace,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        setCurrentWorkspace
    };

    return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

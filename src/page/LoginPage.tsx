import React from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../auth/AuthProvider";

export default function LoginPage() {
    const nav = useNavigate();
    const auth = useAuth();

    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await login(email, password);
            auth.setToken(data.token);
            nav("/facilities", { replace: true });
        } catch (err: any) {
            setError(err?.response?.data?.title || err?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 420, margin: "80px auto", fontFamily: "system-ui" }}>
            <h1>CoreEdificio</h1>
            <p>Inicia sesión</p>

            <form onSubmit={onSubmit}>
                <div style={{ display: "grid", gap: 8 }}>
                    <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button disabled={loading} type="submit">
                        {loading ? "Ingresando..." : "Entrar"}
                    </button>
                </div>
            </form>

            {error && <p style={{ color: "crimson" }}>{error}</p>}
        </div>
    );
}

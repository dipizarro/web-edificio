import { api } from "./client";

export type LoginResponse = {
    token: string;
    expiresAtUtc: string; // si tu API lo devuelve así
    roles: string[];
};

export async function login(email: string, password: string) {
    const res = await api.post<LoginResponse>("/api/auth/login", { email, password });
    return res.data;
}

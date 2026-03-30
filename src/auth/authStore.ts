import { jwtDecode } from "jwt-decode";
import type { JwtClaims } from "./claims";
import { normalizeRoles } from "./claims";

export type AuthState = {
    token: string | null;
    roles: string[];
    communityId: string | null;
    unitId: string | null;
    email: string | null;
    expiresAtUtc: number | null; // epoch seconds
};

const TOKEN_KEY = "coreedificio_token";

export function loadAuth(): AuthState {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        return { token: null, roles: [], communityId: null, unitId: null, email: null, expiresAtUtc: null };
    }

    const claims = jwtDecode<JwtClaims>(token);
    return {
        token,
        roles: normalizeRoles(claims),
        communityId: claims.communityId ?? null,
        unitId: claims.unitId ?? null,
        email: claims.email ?? null,
        expiresAtUtc: claims.exp ?? null,
    };
}

export function saveToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function isExpired(state: AuthState) {
    if (!state.expiresAtUtc) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec >= state.expiresAtUtc;
}

export function hasRole(state: AuthState, role: string) {
    return state.roles.some(r => r.toLowerCase() === role.toLowerCase());
}

export type JwtClaims = {
    sub?: string;
    email?: string;

    // Microsoft style
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string | string[];
    communityId?: string;
    unitId?: string;

    exp?: number;
};

export function normalizeRoles(claims: JwtClaims): string[] {
    const r = claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    if (!r) return [];
    return Array.isArray(r) ? r : [r];
}

import { api } from "./client";

export interface UnitDto {
    id: string;
    communityId: string;
    number: string;
    // Additional fields mapped automatically from backend if needed
}

export async function getUnits(communityId: string): Promise<UnitDto[]> {
    const response = await api.get(`/api/communities/${communityId}/units`);
    return response.data;
}

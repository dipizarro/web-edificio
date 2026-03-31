import { api } from "./client";

export interface FacilityBlockDto {
    id: string;
    communityId: string;
    facilityId: string;
    startAtUtc: string;
    endAtUtc: string;
    reason: string;
    isActive: boolean;
    createdAtUtc: string;
}

export interface CreateFacilityBlockRequest {
    startAtUtc: string;
    endAtUtc: string;
    reason: string;
}

export async function getFacilityBlocks(
    communityId: string,
    facilityId: string,
    fromUtc: string,
    toUtc: string
): Promise<FacilityBlockDto[]> {
    const searchParams = new URLSearchParams();
    if (fromUtc) searchParams.append("from", fromUtc);
    if (toUtc) searchParams.append("to", toUtc);

    const response = await api.get(`/api/communities/${communityId}/facilities/${facilityId}/blocks?${searchParams.toString()}`);
    return response.data;
}

export async function createFacilityBlock(
    communityId: string,
    facilityId: string,
    payload: CreateFacilityBlockRequest
): Promise<FacilityBlockDto> {
    const response = await api.post(`/api/communities/${communityId}/facilities/${facilityId}/blocks`, payload);
    return response.data;
}

export async function deactivateFacilityBlock(
    communityId: string,
    facilityId: string,
    blockId: string
): Promise<void> {
    await api.post(`/api/communities/${communityId}/facilities/${facilityId}/blocks/${blockId}/deactivate`);
}

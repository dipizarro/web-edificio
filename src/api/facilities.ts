import { api } from "./client";

export interface Facility {
    id: string;
    communityId: string;
    name: string;
    description?: string;
    chargingMode: "Free" | "Paid" | "Deposit" | "PaidAndDeposit";
    rentAmount?: number;
    depositAmount?: number;
    requiresApproval: boolean;
    slotDurationMinutes: number;
    isActive: boolean;
}

export async function getFacilities(communityId: string): Promise<Facility[]> {
    const response = await api.get(`/api/communities/${communityId}/facilities`);
    return response.data;
}

export async function getFacilityById(communityId: string, facilityId: string): Promise<Facility> {
    const response = await api.get(`/api/communities/${communityId}/facilities/${facilityId}`);
    return response.data;
}

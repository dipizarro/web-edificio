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

export interface AvailabilitySlotDto {
    startAtUtc: string;
    endAtUtc: string;
    status: "Free" | "Pending" | "Booked" | "Blocked";
    reasonOrStatus: string;
    bookingId?: string;
    blockId?: string;
}

export interface FacilityAvailabilitySlotsResponse {
    communityId: string;
    facilityId: string;
    fromUtc: string;
    toUtc: string;
    slotMinutes: number;
    slots: AvailabilitySlotDto[];
}

export async function getFacilityAvailabilitySlots(
    communityId: string,
    facilityId: string,
    fromUtc: string,
    toUtc: string
): Promise<FacilityAvailabilitySlotsResponse> {
    const response = await api.get(`/api/communities/${communityId}/facilities/${facilityId}/availability/slots`, {
        params: { from: fromUtc, to: toUtc }
    });
    return response.data;
}

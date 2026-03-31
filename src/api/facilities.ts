import { api } from "./client";

export interface Facility {
    id: string;
    communityId: string;
    name: string;
    description?: string;
    chargingMode: "Free" | "Paid" | "Deposit" | "PaidAndDeposit";
    capacity?: number;
    rentAmountClp?: number;
    depositAmountClp?: number;
    requiresApproval: boolean;
    slotDurationMinutes: number;
    maxHoursPerBooking?: number;
    maxBookingsPerMonthPerUnit?: number;
    isActive: boolean;
}

export interface FacilityPayloadDto {
    name: string;
    description?: string;
    capacity?: number;
    chargingMode: "Free" | "Paid" | "Deposit" | "PaidAndDeposit";
    rentAmountClp: number;
    depositAmountClp: number;
    requiresApproval: boolean;
    slotDurationMinutes: number;
    maxHoursPerBooking?: number | null;
    maxBookingsPerMonthPerUnit?: number | null;
}

export async function getFacilities(communityId: string): Promise<Facility[]> {
    const response = await api.get(`/api/communities/${communityId}/facilities`);
    return response.data;
}

export async function getFacilityById(communityId: string, facilityId: string): Promise<Facility> {
    const response = await api.get(`/api/communities/${communityId}/facilities/${facilityId}`);
    return response.data;
}

export async function createFacility(communityId: string, payload: FacilityPayloadDto): Promise<Facility> {
    const response = await api.post(`/api/communities/${communityId}/facilities`, payload);
    return response.data;
}

export async function updateFacility(communityId: string, facilityId: string, payload: FacilityPayloadDto): Promise<Facility> {
    const response = await api.put(`/api/communities/${communityId}/facilities/${facilityId}`, payload);
    return response.data;
}

export async function deactivateFacility(communityId: string, facilityId: string): Promise<Facility> {
    const response = await api.post(`/api/communities/${communityId}/facilities/${facilityId}/deactivate`);
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

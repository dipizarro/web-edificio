import { api } from "./client";

export interface CreateFacilityBookingRequest {
    startAt: string;
    endAt: string;
    notes?: string;
    unitId?: string;
}

export interface BookingResponse {
    id: string;
    status: "PendingApproval" | "Approved" | "Rejected" | "Cancelled";
    // More fields mapped dynamically based on actual response if needed
}

export async function createFacilityBooking(
    communityId: string,
    facilityId: string,
    payload: CreateFacilityBookingRequest
): Promise<BookingResponse> {
    const response = await api.post(`/api/communities/${communityId}/facilities/${facilityId}/bookings`, payload);
    return response.data;
}

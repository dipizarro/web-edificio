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

export interface BookingListDto {
    id: string;
    facilityId: string;
    facilityName: string;
    startAtUtc: string;
    endAtUtc: string;
    status: string;
}

export interface BookingDetailDto extends BookingListDto {
    unitId: string;
    unitNumber: string;
    notes?: string;
    rejectReason?: string;
    cancelReason?: string;
    charges?: any[];
}

export interface GetMyBookingsParams {
    from?: string;
    to?: string;
    status?: string | "All";
}

export async function getMyBookings(params: GetMyBookingsParams): Promise<BookingListDto[]> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.append("from", params.from);
    if (params.to) searchParams.append("to", params.to);
    if (params.status && params.status !== "All") searchParams.append("status", params.status);

    const response = await api.get(`/api/bookings/my?${searchParams.toString()}`);
    return response.data;
}

export async function getBookingById(bookingId: string): Promise<BookingDetailDto> {
    const response = await api.get(`/api/bookings/${bookingId}`);
    return response.data;
}

export async function cancelBooking(bookingId: string, reason: string): Promise<void> {
    await api.post(`/api/bookings/${bookingId}/cancel`, { reason });
}

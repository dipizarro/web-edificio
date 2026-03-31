import { api } from "./client";

export interface UnitComponentDto {
    type: string;
    code: string;
    coefficientPct: number;
    isActive: boolean;
}

export interface StatementLineDto {
    type: string;
    description: string;
    amount: number;
    date: string;
    period: string;
}

export interface UnitStatementDto {
    communityId: string;
    unitId: string;
    unitNumber: string;
    period: string;
    previousBalance: number;
    currentChargesTotal: number;
    paymentsTotal: number;
    totalDue: number;
    dueDate: string;
    unitTotalCoefficientPct: number;
    components: UnitComponentDto[];
    lines: StatementLineDto[];
}

export async function getMyStatement(communityId: string, period: string): Promise<UnitStatementDto> {
    const response = await api.get(`/api/communities/${communityId}/billing/my-statement/${period}`);
    return response.data;
}

export async function getUnitStatement(communityId: string, unitId: string, period: string): Promise<UnitStatementDto> {
    const response = await api.get(`/api/communities/${communityId}/billing/units/${unitId}/statement/${period}`);
    return response.data;
}

export async function downloadMyStatementPdf(communityId: string, period: string, unitNumber: string): Promise<void> {
    const response = await api.get(`/api/communities/${communityId}/billing/my-statement/${period}/pdf`, {
        responseType: 'blob'
    });
    
    triggerBlobDownload(response.data, `CoreEdificio_Statement_${unitNumber}_${period}.pdf`);
}

export async function downloadUnitStatementPdf(communityId: string, unitId: string, period: string, unitNumber: string): Promise<void> {
    const response = await api.get(`/api/communities/${communityId}/billing/units/${unitId}/statement/${period}/pdf`, {
        responseType: 'blob'
    });
    
    triggerBlobDownload(response.data, `CoreEdificio_Statement_${unitNumber}_${period}.pdf`);
}

function triggerBlobDownload(blobData: Blob, filename: string) {
    const url = window.URL.createObjectURL(new Blob([blobData], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

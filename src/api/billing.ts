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

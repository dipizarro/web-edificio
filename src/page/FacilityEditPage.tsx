import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFacilityById, updateFacility } from "@/api/facilities";
import type { FacilityPayloadDto } from "@/api/facilities";
import { useAuth } from "@/auth/AuthProvider";
import { FacilityForm } from "@/components/facilities/FacilityForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit } from "lucide-react";
import { toast } from "sonner";

export default function FacilityEditPage() {
    const { facilityId } = useParams();
    const auth = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: facility, isLoading, isError } = useQuery({
        queryKey: ["facility", auth.communityId, facilityId],
        queryFn: () => getFacilityById(auth.communityId!, facilityId!),
        enabled: !!auth.communityId && !!facilityId,
    });

    const mutation = useMutation({
        mutationFn: (payload: FacilityPayloadDto) => updateFacility(auth.communityId!, facilityId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["facility", auth.communityId, facilityId] });
            queryClient.invalidateQueries({ queryKey: ["facilities", auth.communityId] });
            toast.success("Parámetros de la instalación actualizados exitosamente.");
            navigate(`/facilities/${facilityId}`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.response?.data?.title || "No se pudo actualizar la instalación.");
        }
    });

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Recuperando configuración base...</div>;
    }

    if (isError || !facility) {
        return <div className="p-8 text-center text-destructive font-bold">Error de lectura. La instalación podría no existir o los permisos están corruptos.</div>;
    }

    const initialPayload: FacilityPayloadDto = {
        name: facility.name,
        description: facility.description || "",
        capacity: facility.capacity,
        chargingMode: facility.chargingMode,
        rentAmountClp: facility.rentAmountClp || 0,
        depositAmountClp: facility.depositAmountClp || 0,
        requiresApproval: facility.requiresApproval,
        slotDurationMinutes: facility.slotDurationMinutes,
        maxHoursPerBooking: facility.maxHoursPerBooking,
        maxBookingsPerMonthPerUnit: facility.maxBookingsPerMonthPerUnit,
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 border-b pb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/facilities/${facilityId}`)}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Edit className="w-6 h-6 text-primary" />
                        Modificar {facility.name}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Ajusta los detalles y atributos administrativos de este espacio.</p>
                </div>
            </div>

            <FacilityForm 
                mode="edit" 
                initialValues={initialPayload} 
                onSubmit={mutation.mutate} 
                isSubmitting={mutation.isPending} 
            />
        </div>
    );
}

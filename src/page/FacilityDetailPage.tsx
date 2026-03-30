import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { getFacilityById } from "@/api/facilities";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, CalendarPlus } from "lucide-react";

export default function FacilityDetailPage() {
    const { facilityId } = useParams();
    const { communityId } = useAuth();
    const navigate = useNavigate();

    const { data: facility, isLoading, isError } = useQuery({
        queryKey: ["facility", communityId, facilityId],
        queryFn: () => getFacilityById(communityId!, facilityId!),
        enabled: !!communityId && !!facilityId,
    });

    if (isLoading) return <div className="p-4">Cargando detalles...</div>;
    if (isError || !facility) return <div className="p-4 text-destructive">Error al cargar la instalación.</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/facilities")}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{facility.name}</h1>
            </div>

            <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Detalles</h2>
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div>
                        <p className="text-muted-foreground mb-1">Modo de cobro</p>
                        <p className="font-medium">{facility.chargingMode}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Duración del turno</p>
                        <p className="font-medium">{facility.slotDurationMinutes} min</p>
                    </div>
                    {facility.requiresApproval && (
                        <div>
                            <p className="text-muted-foreground mb-1">Aprobación</p>
                            <p className="font-medium text-destructive">Requiere autorización</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t">
                    <Button variant="outline" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Ver calendario
                    </Button>
                    <Button className="gap-2">
                        <CalendarPlus className="h-4 w-4" />
                        Crear reserva
                    </Button>
                </div>
            </div>
        </div>
    );
}

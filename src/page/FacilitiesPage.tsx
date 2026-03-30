import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { getFacilities } from "@/api/facilities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FacilitiesPage() {
    const { communityId } = useAuth();
    const navigate = useNavigate();

    const { data: facilities, isLoading, isError } = useQuery({
        queryKey: ["facilities", communityId],
        queryFn: () => getFacilities(communityId!),
        enabled: !!communityId,
    });

    if (!communityId) {
        return (
            <Card className="max-w-md mx-auto mt-10">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5" />
                        Acceso Denegado
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    No se detectó un <strong>communityId</strong> en tu sesión. Necesitas iniciar sesión en el contexto de un edificio para ver las instalaciones.
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return <div className="p-4">Cargando instalaciones...</div>;
    }

    if (isError) {
        return <div className="p-4 text-destructive">Ocurrió un error al cargar las instalaciones.</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Instalaciones</h1>

            {facilities?.length === 0 ? (
                <p className="text-muted-foreground">No hay instalaciones configuradas para este edificio.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {facilities?.map((facility) => (
                        <Card 
                            key={facility.id} 
                            className={`flex flex-col cursor-pointer transition-colors hover:bg-muted/50 ${!facility.isActive && "opacity-60"}`}
                            onClick={() => navigate(`/facilities/${facility.id}`)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-4">
                                    <CardTitle className="text-xl">{facility.name}</CardTitle>
                                    <Badge variant={facility.isActive ? "default" : "secondary"}>
                                        {facility.isActive ? "Activo" : "Inactivo"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 pb-4">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">{facility.chargingMode}</Badge>
                                        {facility.requiresApproval && (
                                            <Badge variant="destructive">Requiere Aprobación</Badge>
                                        )}
                                    </div>
                                    
                                    <div className="text-sm text-muted-foreground flex flex-col gap-2 mt-4">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            <span>Turnos de {facility.slotDurationMinutes} min</span>
                                        </div>
                                        
                                        {(facility.chargingMode === "Paid" || facility.chargingMode === "PaidAndDeposit") && facility.rentAmount && (
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                <span>Alquiler: ${facility.rentAmount}</span>
                                            </div>
                                        )}
                                        
                                        {(facility.chargingMode === "Deposit" || facility.chargingMode === "PaidAndDeposit") && facility.depositAmount && (
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert className="h-4 w-4" />
                                                <span>Depósito: ${facility.depositAmount}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

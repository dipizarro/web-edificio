import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { getFacilities, deactivateFacility } from "@/api/facilities";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, ShieldAlert, Plus, Eye, Edit, Trash2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { hasRole } from "@/auth/authStore";
import { toast } from "sonner";

export default function FacilitiesPage() {
    const auth = useAuth();
    const communityId = auth.communityId;
    const isAdminOrCommittee = hasRole(auth, "Admin") || hasRole(auth, "Committee");
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: facilities, isLoading, isError } = useQuery({
        queryKey: ["facilities", communityId],
        queryFn: () => getFacilities(communityId!),
        enabled: !!communityId,
    });

    const deactivateMutation = useMutation({
        mutationFn: (facilityId: string) => deactivateFacility(communityId!, facilityId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["facilities", communityId] });
            toast.success("La instalación ha sido desactivada correctamente.");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Error al desactivar la instalación.");
        }
    });

    const handleDeactivate = (e: React.MouseEvent, facilityId: string, name: string) => {
        e.stopPropagation();
        if (window.confirm(`¿Está seguro que desea desactivar "${name}"? Esta acción no se puede deshacer desde la UI.`)) {
            deactivateMutation.mutate(facilityId);
        }
    };

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
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Instalaciones</h1>
                {isAdminOrCommittee && (
                    <Button onClick={() => navigate("/facilities/new")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Instalación
                    </Button>
                )}
            </div>

            {facilities?.length === 0 ? (
                <p className="text-muted-foreground">No hay instalaciones configuradas para este edificio.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {facilities?.map((facility) => (
                        <Card 
                            key={facility.id} 
                            className={`flex flex-col transition-all duration-200 border-border group overflow-hidden ${!facility.isActive ? "opacity-70 grayscale-[0.5] border-muted bg-muted/20" : "hover:border-primary/50 hover:shadow-md"}`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{facility.name}</CardTitle>
                                        {!facility.isActive && (
                                            <Badge variant="secondary" className="bg-muted-foreground/20 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">Inactiva</Badge>
                                        )}
                                    </div>
                                    <Badge variant={facility.isActive ? "default" : "outline"} className={facility.isActive ? "bg-green-600 hover:bg-green-700" : ""}>
                                        {facility.isActive ? "Activo" : "Fuera de Servicio"}
                                    </Badge>
                                </div>
                                {facility.description && (
                                    <CardDescription className="line-clamp-2 mt-2 min-h-[40px]">
                                        {facility.description}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="flex-1 pb-4">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary" className="font-normal">{facility.chargingMode}</Badge>
                                        {facility.requiresApproval && (
                                            <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5 font-normal">
                                                Requiere Aprobación
                                            </Badge>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm pt-2 border-t">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{facility.slotDurationMinutes} min</span>
                                        </div>
                                        
                                        {(facility.chargingMode === "Paid" || facility.chargingMode === "PaidAndDeposit") && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <DollarSign className="h-4 w-4" />
                                                <span className="font-medium text-foreground">${facility.rentAmountClp || 0}</span>
                                            </div>
                                        )}
                                        
                                        {(facility.chargingMode === "Deposit" || facility.chargingMode === "PaidAndDeposit") && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <ShieldAlert className="h-4 w-4" />
                                                <span className="font-medium text-foreground">${facility.depositAmountClp || 0}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 pb-4 px-6 flex items-center justify-between gap-2 border-t mt-4 bg-muted/5">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-primary hover:text-primary hover:bg-primary/10 px-2"
                                    onClick={() => navigate(`/facilities/${facility.id}`)}
                                >
                                    <Eye className="w-4 h-4 mr-1.5" /> Detalle
                                </Button>
                                
                                <div className="flex items-center gap-1">
                                    {isAdminOrCommittee && facility.isActive && (
                                        <>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-muted-foreground hover:text-foreground px-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/facilities/${facility.id}/edit`);
                                                }}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-destructive hover:bg-destructive/10 px-2"
                                                onClick={(e) => handleDeactivate(e, facility.id, facility.name)}
                                                disabled={deactivateMutation.isPending}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="gap-1.5"
                                        onClick={() => navigate(`/facilities/${facility.id}`)}
                                    >
                                        Reservar <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

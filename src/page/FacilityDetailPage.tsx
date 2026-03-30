import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { getFacilityById, getFacilityAvailabilitySlots } from "@/api/facilities";
import type { AvailabilitySlotDto } from "@/api/facilities";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronLeft, CalendarPlus, Info, Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const getLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatTime = (utcStr: string) => {
    return new Date(utcStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function FacilityDetailPage() {
    const { facilityId } = useParams();
    const { communityId } = useAuth();
    const navigate = useNavigate();

    const [selectedDateStr, setSelectedDateStr] = useState<string>(getLocalYYYYMMDD(new Date()));
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlotDto | null>(null);

    const fromUtc = useMemo(() => {
        const d = new Date(`${selectedDateStr}T00:00:00`);
        return d.toISOString();
    }, [selectedDateStr]);

    const toUtc = useMemo(() => {
        const d = new Date(`${selectedDateStr}T23:59:59.999`);
        return d.toISOString();
    }, [selectedDateStr]);

    const { data: facility, isLoading: isLoadingFacility, isError: isErrorFacility } = useQuery({
        queryKey: ["facility", communityId, facilityId],
        queryFn: () => getFacilityById(communityId!, facilityId!),
        enabled: !!communityId && !!facilityId,
    });

    const { data: availability, isLoading: isLoadingSlots, isError: isErrorSlots } = useQuery({
        queryKey: ["facility-slots", communityId, facilityId, fromUtc, toUtc],
        queryFn: () => getFacilityAvailabilitySlots(communityId!, facilityId!, fromUtc, toUtc),
        enabled: !!communityId && !!facilityId && !!fromUtc && !!toUtc,
    });

    const handleSlotClick = (slot: AvailabilitySlotDto) => {
        if (slot.status === "Free") {
            setSelectedSlot(slot);
        }
    };

    if (isLoadingFacility) return <div className="p-4">Cargando detalles...</div>;
    if (isErrorFacility || !facility) return <div className="p-4 text-destructive">Error al cargar la instalación.</div>;

    const getStatusClasses = (status: string) => {
        switch (status) {
            case "Free": return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 cursor-pointer dark:bg-green-900/40 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-800/60";
            case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-200 opacity-70 cursor-not-allowed dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800";
            case "Booked": return "bg-red-100 text-red-800 border-red-200 opacity-70 cursor-not-allowed dark:bg-red-900/40 dark:text-red-300 dark:border-red-800";
            case "Blocked": return "bg-gray-100 text-gray-800 border-gray-200 opacity-70 cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
            default: return "bg-background";
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/facilities")}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{facility.name}</h1>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{facility.chargingMode}</Badge>
                        <span>&bull;</span>
                        <Clock className="w-4 h-4" />
                        <span>Turnos de {facility.slotDurationMinutes} min</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Disponibilidad</CardTitle>
                                    <CardDescription>Selecciona un día para ver los turnos disponibles.</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                    <Input 
                                        type="date" 
                                        value={selectedDateStr} 
                                        onChange={(e) => {
                                            setSelectedDateStr(e.target.value);
                                            setSelectedSlot(null); // Reset selection on day change
                                        }} 
                                        className="w-auto"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingSlots ? (
                                <div className="py-8 text-center text-muted-foreground">Cargando agenda...</div>
                            ) : isErrorSlots ? (
                                <div className="py-8 text-center text-destructive">Error al cargar la disponibilidad para este día.</div>
                            ) : availability?.slots.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground">No hay turnos configurados para este día.</div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {availability?.slots.map((slot, index) => {
                                        const isSelected = selectedSlot?.startAtUtc === slot.startAtUtc;
                                        return (
                                            <div 
                                                key={index}
                                                onClick={() => handleSlotClick(slot)}
                                                className={cn(
                                                    "border rounded-md p-3 transition-colors text-center shadow-sm select-none",
                                                    getStatusClasses(slot.status),
                                                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background font-medium"
                                                )}
                                            >
                                                <div className="text-sm">
                                                    {formatTime(slot.startAtUtc)} - {formatTime(slot.endAtUtc)}
                                                </div>
                                                <div className="text-xs mt-1 font-medium capitalize flex items-center justify-center gap-1">
                                                    {slot.status === "Free" ? "Libre" : slot.reasonOrStatus}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reserva</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedSlot ? (
                                <div className="space-y-4">
                                    <div className="bg-muted/50 p-4 rounded-lg space-y-2 border">
                                        <p className="text-sm text-muted-foreground">Turno seleccionado</p>
                                        <p className="font-semibold text-lg flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-primary" />
                                            {formatTime(selectedSlot.startAtUtc)} - {formatTime(selectedSlot.endAtUtc)}
                                        </p>
                                    </div>
                                    <Button className="w-full gap-2 mt-4" size="lg">
                                        <CalendarPlus className="w-4 h-4" />
                                        Comenzar reserva
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
                                        <Info className="w-3 h-3" />
                                        La reserva no se confirma inmediatamente si requiere aprobación.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                        <CalendarIcon className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground max-w-[200px]">
                                        Selecciona un turno libre en la agenda para comenzar.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

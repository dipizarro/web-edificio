import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { hasRole } from "@/auth/authStore";
import { getFacilityById, getFacilityAvailabilitySlots } from "@/api/facilities";
import type { AvailabilitySlotDto } from "@/api/facilities";
import { getUnits } from "@/api/units";
import type { UnitDto } from "@/api/units";
import { createFacilityBooking } from "@/api/bookings";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFacilityBlocks, createFacilityBlock, deactivateFacilityBlock } from "@/api/blocks";
import type { FacilityBlockDto } from "@/api/blocks";
import { ChevronLeft, CalendarPlus, Info, Calendar as CalendarIcon, Clock, Lock, ShieldAlert, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
    const auth = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [selectedDateStr, setSelectedDateStr] = useState<string>(getLocalYYYYMMDD(new Date()));
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlotDto | null>(null);
    const [notes, setNotes] = useState("");
    const [adminUnitId, setAdminUnitId] = useState("");

    const [blockStartTime, setBlockStartTime] = useState("08:00");
    const [blockEndTime, setBlockEndTime] = useState("10:00");
    const [blockReason, setBlockReason] = useState("");

    const isAdminOrCommittee = hasRole(auth, "Admin") || hasRole(auth, "Committee");

    const fromUtc = useMemo(() => {
        const d = new Date(`${selectedDateStr}T00:00:00`);
        return d.toISOString();
    }, [selectedDateStr]);

    const toUtc = useMemo(() => {
        const d = new Date(`${selectedDateStr}T23:59:59.999`);
        return d.toISOString();
    }, [selectedDateStr]);

    const { data: facility, isLoading: isLoadingFacility, isError: isErrorFacility } = useQuery({
        queryKey: ["facility", auth.communityId, facilityId],
        queryFn: () => getFacilityById(auth.communityId!, facilityId!),
        enabled: !!auth.communityId && !!facilityId,
    });

    const { data: availability, isLoading: isLoadingSlots, isError: isErrorSlots } = useQuery({
        queryKey: ["facility-slots", auth.communityId, facilityId, fromUtc, toUtc],
        queryFn: () => getFacilityAvailabilitySlots(auth.communityId!, facilityId!, fromUtc, toUtc),
        enabled: !!auth.communityId && !!facilityId && !!fromUtc && !!toUtc,
    });

    const { data: units, isLoading: isLoadingUnits } = useQuery({
        queryKey: ["units", auth.communityId],
        queryFn: () => getUnits(auth.communityId!),
        enabled: !!auth.communityId && isAdminOrCommittee,
    });

    const { data: blocks, isLoading: isLoadingBlocks, isError: isErrorBlocks } = useQuery({
        queryKey: ["facility-blocks", auth.communityId, facilityId, fromUtc, toUtc],
        queryFn: () => getFacilityBlocks(auth.communityId!, facilityId!, fromUtc, toUtc),
        enabled: !!auth.communityId && !!facilityId && !!fromUtc && !!toUtc && isAdminOrCommittee,
    });

    const createBooking = useMutation({
        mutationFn: (payload: any) => createFacilityBooking(auth.communityId!, facilityId!, payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["facility-slots", auth.communityId, facilityId] });
            setSelectedSlot(null);
            setNotes("");
            setAdminUnitId("");
            
            if (data.status === "PendingApproval") {
                toast.success("Reserva enviada para aprobación de la administración.");
            } else {
                toast.success("Reserva confirmada exitosamente.");
            }
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || error.response?.data?.title || "Error desconocido";
            toast.error(`No se pudo reservar: ${msg}`);
        }
    });

    const createBlockMutation = useMutation({
        mutationFn: (payload: any) => createFacilityBlock(auth.communityId!, facilityId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["facility-blocks", auth.communityId, facilityId] });
            queryClient.invalidateQueries({ queryKey: ["facility-slots", auth.communityId, facilityId] });
            setBlockStartTime("08:00");
            setBlockEndTime("10:00");
            setBlockReason("");
            toast.success("Bloqueo administrativo registrado. La agenda ha sido actualizada correctamente.");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.response?.data?.title || "Error al crear bloqueo administrativo.");
        }
    });

    const deactivateBlockMutation = useMutation({
        mutationFn: (blockId: string) => deactivateFacilityBlock(auth.communityId!, facilityId!, blockId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["facility-blocks", auth.communityId, facilityId] });
            queryClient.invalidateQueries({ queryKey: ["facility-slots", auth.communityId, facilityId] });
            toast.success("Bloqueo desactivado correctamente. Los turnos han vuelto a ser liberados.");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Error al desactivar bloqueo administrativo.");
        }
    });

    const handleSlotClick = (slot: AvailabilitySlotDto) => {
        if (slot.status === "Free") {
            setSelectedSlot(slot);
        }
    };

    const handleBookingSubmit = () => {
        if (!selectedSlot) return;
        
        const payload = {
            startAt: selectedSlot.startAtUtc,
            endAt: selectedSlot.endAtUtc,
            notes: notes.trim() || undefined,
            unitId: isAdminOrCommittee ? (adminUnitId.trim() || undefined) : (auth.unitId || undefined)
        };

        createBooking.mutate(payload);
    };

    const handleBlockSubmit = () => {
        if (!blockReason.trim()) {
            toast.error("Debe ingresar un motivo para el bloqueo administrativo.");
            return;
        }

        const blockStartUtc = new Date(`${selectedDateStr}T${blockStartTime}:00`).toISOString();
        const blockEndUtc = new Date(`${selectedDateStr}T${blockEndTime}:00`).toISOString();

        if (new Date(blockStartUtc) >= new Date(blockEndUtc)) {
            toast.error("La hora de inicio debe ser anterior a la hora de término.");
            return;
        }

        createBlockMutation.mutate({
            startAtUtc: blockStartUtc,
            endAtUtc: blockEndUtc,
            reason: blockReason.trim()
        });
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                {isAdminOrCommittee && (
                    <Button variant="outline" onClick={() => navigate(`/facilities/${facility.id}/edit`)}>
                        <Edit className="w-4 h-4 mr-2" /> Editar Instalación
                    </Button>
                )}
            </div>

            <Tabs defaultValue="reservas" className="w-full">
                {isAdminOrCommittee && (
                    <TabsList className="mb-4">
                        <TabsTrigger value="reservas">Agenda de Reservas</TabsTrigger>
                        <TabsTrigger value="blocks"><ShieldAlert className="w-4 h-4 mr-2" /> Bloqueos Administrativos</TabsTrigger>
                    </TabsList>
                )}

                <TabsContent value="reservas">
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
                                            setSelectedSlot(null);
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
                            <CardTitle>Generar Reserva</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedSlot ? (
                                <div className="space-y-5">
                                    <div className="bg-muted/50 p-4 rounded-lg space-y-2 border">
                                        <p className="text-sm text-muted-foreground">Turno seleccionado</p>
                                        <p className="font-semibold text-lg flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-primary" />
                                            {formatTime(selectedSlot.startAtUtc)} - {formatTime(selectedSlot.endAtUtc)}
                                        </p>
                                    </div>

                                    <div className="bg-muted/30 p-4 rounded-lg space-y-2 border text-sm">
                                        <p className="font-medium flex items-center gap-2">
                                            <Info className="w-4 h-4 text-muted-foreground" />
                                            Condiciones de reserva
                                        </p>
                                        <ul className="space-y-1 mt-2 text-muted-foreground">
                                            <li>• Modo de cobro: <strong>{facility.chargingMode}</strong></li>
                                            {(facility.chargingMode === "Paid" || facility.chargingMode === "PaidAndDeposit") && facility.rentAmountClp !== undefined && facility.rentAmountClp !== null && (
                                                <li>• Costo alquiler: <strong>${facility.rentAmountClp}</strong></li>
                                            )}
                                            {(facility.chargingMode === "Deposit" || facility.chargingMode === "PaidAndDeposit") && facility.depositAmountClp !== undefined && facility.depositAmountClp !== null && (
                                                <li>• Depósito exigido: <strong>${facility.depositAmountClp}</strong></li>
                                            )}
                                            {facility.requiresApproval && (
                                                <li className="text-amber-600 dark:text-amber-500 font-medium">
                                                    • Requiere aprobación de la administración.
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="space-y-4 pt-2 border-t">
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">Notas (opcional)</label>
                                            <textarea 
                                                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="Comentarios adicionales..."
                                                value={notes}
                                                onChange={e => setNotes(e.target.value)}
                                                disabled={createBooking.isPending}
                                            />
                                        </div>

                                        {isAdminOrCommittee && (
                                            <div>
                                                <label className="text-sm font-medium mb-1.5 block text-primary">Unidad (Committee/Admin)</label>
                                                <Select 
                                                    value={adminUnitId} 
                                                    onValueChange={(val) => setAdminUnitId(val || "")} 
                                                    disabled={createBooking.isPending || isLoadingUnits}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={isLoadingUnits ? "Cargando unidades..." : "Seleccione una unidad"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {units?.map((unit: UnitDto) => (
                                                            <SelectItem key={unit.id} value={unit.id}>
                                                                {unit.number}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground mt-1.5">Como administrador, debes especificar para qué unidad es esta reserva.</p>
                                            </div>
                                        )}
                                    </div>

                                    <Button 
                                        className="w-full gap-2 mt-2" 
                                        size="lg" 
                                        onClick={handleBookingSubmit}
                                        disabled={createBooking.isPending || (isAdminOrCommittee && !adminUnitId.trim())}
                                    >
                                        <CalendarPlus className="w-4 h-4" />
                                        {createBooking.isPending ? "Procesando..." : "Confirmar Reserva"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                        <CalendarIcon className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground max-w-[200px]">
                                        Selecciona un turno libre en la agenda para reservar.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            </TabsContent>

            {isAdminOrCommittee && (
                <TabsContent value="blocks">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader className="pb-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle>Registro de Bloqueos Activos</CardTitle>
                                            <CardDescription>Los períodos enlistados aquí no pueden ser reservados bajo ningún rol.</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                            <Input 
                                                type="date" 
                                                value={selectedDateStr} 
                                                onChange={(e) => setSelectedDateStr(e.target.value)} 
                                                className="w-auto"
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingBlocks ? (
                                        <div className="py-8 text-center text-muted-foreground">Cargando bloqueos...</div>
                                    ) : isErrorBlocks ? (
                                        <div className="py-8 text-center text-destructive">Error al cargar la información.</div>
                                    ) : !blocks || blocks.length === 0 ? (
                                        <div className="py-8 text-center text-muted-foreground">No existen bloqueos administrativos planificados para este día.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Ingreso</TableHead>
                                                        <TableHead>Vencimiento</TableHead>
                                                        <TableHead>Motivo</TableHead>
                                                        <TableHead>Estado</TableHead>
                                                        <TableHead className="text-right">Acción</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {blocks.map((block: FacilityBlockDto) => (
                                                        <TableRow key={block.id}>
                                                            <TableCell className="font-medium">{formatTime(block.startAtUtc)}</TableCell>
                                                            <TableCell className="font-medium">{formatTime(block.endAtUtc)}</TableCell>
                                                            <TableCell className="text-muted-foreground">{block.reason}</TableCell>
                                                            <TableCell>
                                                                {block.isActive ? (
                                                                    <Badge variant="destructive" className="bg-red-600">Activo</Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-slate-500 border-slate-300">Resuelto</Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right whitespace-nowrap">
                                                                {block.isActive && (
                                                                    <Button 
                                                                        variant="destructive" 
                                                                        size="sm"
                                                                        disabled={deactivateBlockMutation.isPending}
                                                                        onClick={() => {
                                                                            if (window.confirm("¿Está seguro que desea desactivar este bloqueo permanentemente?")) {
                                                                                deactivateBlockMutation.mutate(block.id);
                                                                            }
                                                                        }}
                                                                    >
                                                                        Desmontar
                                                                    </Button>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="space-y-6">
                            <Card className="border-secondary">
                                <CardHeader className="bg-secondary/20">
                                    <CardTitle className="flex items-center gap-2">
                                        <Lock className="w-5 h-5" /> Instaurar Bloqueo
                                    </CardTitle>
                                    <CardDescription>Genera una interrupción no reservable forzando el estado a `Blocked` transversalmente.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Desde (Hora)</label>
                                            <Input type="time" value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)} disabled={createBlockMutation.isPending} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Hasta (Hora)</label>
                                            <Input type="time" value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)} disabled={createBlockMutation.isPending} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Motivo Administrativo</label>
                                        <Input 
                                            placeholder="Ej: Mantención preventiva..." 
                                            value={blockReason}
                                            onChange={e => setBlockReason(e.target.value)}
                                            disabled={createBlockMutation.isPending}
                                        />
                                    </div>
                                    <Button 
                                        className="w-full gap-2 mt-2" 
                                        size="lg" 
                                        variant="default"
                                        onClick={handleBlockSubmit}
                                        disabled={createBlockMutation.isPending || !blockStartTime || !blockEndTime || !blockReason}
                                    >
                                        <ShieldAlert className="w-4 h-4" />
                                        {createBlockMutation.isPending ? "Configurando..." : "Aplicar Restricción"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            )}
            </Tabs>
        </div>
    );
}

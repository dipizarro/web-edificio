import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getCommunityBookings, approveBooking, rejectBooking, completeBooking } from "@/api/bookings";
import type { BookingListDto } from "@/api/bookings";
import { getFacilities } from "@/api/facilities";
import type { Facility } from "@/api/facilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Filter, Eye, CheckCircle, XCircle, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";

const getStatusBadge = (status: string) => {
    switch (status) {
        case "Approved": return <Badge className="bg-green-600">Aprobada</Badge>;
        case "PendingApproval": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
        case "Cancelled": return <Badge variant="destructive">Cancelada</Badge>;
        case "Rejected": return <Badge variant="destructive">Rechazada</Badge>;
        case "Completed": return <Badge variant="default" className="bg-blue-600">Completada</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
};

const formatDateTime = (utcStr: string) => {
    return new Date(utcStr).toLocaleString([], { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute:'2-digit' 
    });
};

export default function AdminBookingsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const auth = useAuth();

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [facilityIdFilter, setFacilityIdFilter] = useState("All");

    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedBooking, setSelectedBooking] = useState<{ id: string, facilityId: string } | null>(null);

    const { data: facilities } = useQuery({
        queryKey: ["facilities", auth.communityId],
        queryFn: () => getFacilities(auth.communityId!),
        enabled: !!auth.communityId,
    });

    const { data: bookings, isLoading, isError } = useQuery({
        queryKey: ["community-bookings", auth.communityId, from, to, statusFilter, facilityIdFilter],
        queryFn: () => getCommunityBookings(auth.communityId!, {
            from: from || undefined,
            to: to || undefined,
            status: statusFilter,
            facilityId: facilityIdFilter
        }),
        enabled: !!auth.communityId,
    });

    const invalidateGlobalCache = () => {
        queryClient.invalidateQueries({ queryKey: ["community-bookings"] });
        queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
        // Facility slots are trickier without specific IDs, but they'll refetch on mount.
        // We can optionally invalidate all slots for safety:
        queryClient.invalidateQueries({ queryKey: ["facility-slots"] });
    };

    const approveMutation = useMutation({
        mutationFn: ({ facilityId, bookingId }: { facilityId: string, bookingId: string }) => 
            approveBooking(auth.communityId!, facilityId, bookingId),
        onSuccess: () => {
            invalidateGlobalCache();
            toast.success("Reserva aprobada.");
        },
        onError: (error: any) => toast.error(error.response?.data?.message || "Error al aprobar la reserva.")
    });

    const completeMutation = useMutation({
        mutationFn: (bookingId: string) => completeBooking(bookingId),
        onSuccess: () => {
            invalidateGlobalCache();
            toast.success("Reserva completada.");
        },
        onError: (error: any) => toast.error(error.response?.data?.message || "Error al completar la reserva.")
    });

    const rejectMutation = useMutation({
        mutationFn: ({ facilityId, bookingId, reason }: { facilityId: string, bookingId: string, reason: string }) => 
            rejectBooking(auth.communityId!, facilityId, bookingId, reason),
        onSuccess: () => {
            invalidateGlobalCache();
            setRejectDialogOpen(false);
            setRejectReason("");
            setSelectedBooking(null);
            toast.success("Reserva rechazada.");
        },
        onError: (error: any) => toast.error(error.response?.data?.message || "Error al rechazar.")
    });

    const handleRejectClick = (facilityId: string, bookingId: string) => {
        setSelectedBooking({ facilityId, id: bookingId });
        setRejectReason("");
        setRejectDialogOpen(true);
    };

    const handleRejectSubmit = () => {
        if (!rejectReason.trim()) {
            toast.error("El motivo de rechazo es obligatorio.");
            return;
        }
        if (selectedBooking) {
            rejectMutation.mutate({ 
                facilityId: selectedBooking.facilityId, 
                bookingId: selectedBooking.id, 
                reason: rejectReason.trim() 
            });
        }
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto p-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Administración de Reservas</h1>
                <p className="text-muted-foreground mt-1">Gestiona las solicitudes de áreas comunes de la comunidad.</p>
            </div>
            
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Filter className="w-5 h-5" /> Filtros del Padrón
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Desde</label>
                            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Hasta</label>
                            <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Instalación</label>
                            <Select value={facilityIdFilter} onValueChange={(val) => setFacilityIdFilter(val || "All")}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">Todas</SelectItem>
                                    {facilities?.map((f: Facility) => (
                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Estado</label>
                            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "All")}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">Todos</SelectItem>
                                    <SelectItem value="PendingApproval">Pendientes</SelectItem>
                                    <SelectItem value="Approved">Aprobados</SelectItem>
                                    <SelectItem value="Rejected">Rechazados</SelectItem>
                                    <SelectItem value="Cancelled">Cancelados</SelectItem>
                                    <SelectItem value="Completed">Completados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Recopilando padrón de reservas...</div>
                    ) : isError ? (
                        <div className="p-8 text-center text-destructive">Error al cargar las reservas del condominio.</div>
                    ) : !bookings || bookings.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <CalendarIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground font-medium">No se encontraron reservas con los filtros aplicados.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Unidad</TableHead>
                                        <TableHead>Instalación</TableHead>
                                        <TableHead>Inicio</TableHead>
                                        <TableHead>Término</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bookings.map((booking: BookingListDto) => (
                                        <TableRow key={booking.id}>
                                            <TableCell className="font-semibold">{booking.unitNumber || "N/A"}</TableCell>
                                            <TableCell className="font-medium text-muted-foreground">{booking.facilityName}</TableCell>
                                            <TableCell>{formatDateTime(booking.startAtUtc)}</TableCell>
                                            <TableCell>{formatDateTime(booking.endAtUtc)}</TableCell>
                                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                <div className="flex justify-end items-center gap-2">
                                                    {booking.status === "PendingApproval" && (
                                                        <>
                                                            <Button 
                                                                size="sm" 
                                                                title="Aprobar"
                                                                className="bg-green-600 hover:bg-green-700 h-8 px-2"
                                                                disabled={approveMutation.isPending}
                                                                onClick={() => approveMutation.mutate({ facilityId: booking.facilityId, bookingId: booking.id })}
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="destructive" 
                                                                size="sm" 
                                                                title="Rechazar"
                                                                className="h-8 px-2"
                                                                onClick={() => handleRejectClick(booking.facilityId, booking.id)}
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    {booking.status === "Approved" && (
                                                        <Button 
                                                            variant="default"
                                                            size="sm"
                                                            title="Completar"
                                                            className="bg-blue-600 hover:bg-blue-700 h-8 px-2"
                                                            disabled={completeMutation.isPending}
                                                            onClick={() => completeMutation.mutate(booking.id)}
                                                        >
                                                            <CheckSquare className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => navigate(`/bookings/${booking.id}`)}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar Solicitud de Reserva</DialogTitle>
                        <DialogDescription>
                            Debes justificar institucionalmente por qué la unidad no puede optar a este bloque. Esta resolución enviará una notificación al instante.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder="Ej: Multas pendientes de pago, Reparaciones en curso..." 
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            disabled={rejectMutation.isPending}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleRejectSubmit} disabled={rejectMutation.isPending || !rejectReason.trim()}>
                            {rejectMutation.isPending ? "Procesando..." : "Confirmar Rechazo"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { getBookingById, cancelBooking, approveBooking, rejectBooking, completeBooking } from "@/api/bookings";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Trash2, Calendar, MapPin, Clock, Home, AlertCircle, CheckCircle, XCircle, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { hasRole } from "@/auth/authStore";

const formatDateTime = (utcStr: string) => {
    return new Date(utcStr).toLocaleString([], { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute:'2-digit' 
    });
};

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

export default function BookingDetailPage() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const auth = useAuth();
    
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const isAuthorizedRole = hasRole(auth, "Resident") || hasRole(auth, "Committee") || hasRole(auth, "Admin");
    const isAdminOrCommittee = hasRole(auth, "Committee") || hasRole(auth, "Admin");

    const { data: booking, isLoading, isError } = useQuery({
        queryKey: ["booking", bookingId],
        queryFn: () => getBookingById(bookingId!),
        enabled: !!bookingId,
    });

    const invalidateGlobalCache = () => {
        queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
        queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
        queryClient.invalidateQueries({ queryKey: ["community-bookings"] });
        if (booking?.facilityId) {
            queryClient.invalidateQueries({ queryKey: ["facility-slots", auth.communityId, booking.facilityId] });
        }
    };

    const cancelMutation = useMutation({
        mutationFn: (reason: string) => cancelBooking(bookingId!, reason),
        onSuccess: () => {
            invalidateGlobalCache();
            setCancelDialogOpen(false);
            setCancelReason("");
            toast.success("La reserva ha sido cancelada exitosamente.");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "No se pudo cancelar la reserva.");
        }
    });

    const approveMutation = useMutation({
        mutationFn: () => approveBooking(auth.communityId!, booking!.facilityId, bookingId!),
        onSuccess: () => {
            invalidateGlobalCache();
            toast.success("Reserva aprobada con éxito.");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Error al aprobar la reserva.");
        }
    });

    const rejectMutation = useMutation({
        mutationFn: (reason: string) => rejectBooking(auth.communityId!, booking!.facilityId, bookingId!, reason),
        onSuccess: () => {
            invalidateGlobalCache();
            setRejectDialogOpen(false);
            setRejectReason("");
            toast.success("Reserva rechazada y cupo liberado.");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Error al rechazar la reserva.");
        }
    });

    const completeMutation = useMutation({
        mutationFn: () => completeBooking(bookingId!),
        onSuccess: () => {
            invalidateGlobalCache();
            toast.success("Reserva marcada como completada exitosamente.");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Error al completar la reserva.");
        }
    });

    const handleCancelSubmit = () => {
        if (!cancelReason.trim()) {
            toast.error("Debe ingresar un motivo.");
            return;
        }
        cancelMutation.mutate(cancelReason.trim());
    };

    const handleRejectSubmit = () => {
        if (!rejectReason.trim()) {
            toast.error("Debe ingresar el motivo de rechazo obligatoriamente.");
            return;
        }
        rejectMutation.mutate(rejectReason.trim());
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando detalles de la reserva...</div>;
    if (isError || !booking) return <div className="p-8 text-center text-destructive">Error al cargar la reserva solicitada.</div>;

    const canCancel = (booking.status === "Approved" || booking.status === "PendingApproval") && isAuthorizedRole;
    const isPendingAdminFlow = isAdminOrCommittee && booking.status === "PendingApproval";
    const isApprovedAdminFlow = isAdminOrCommittee && booking.status === "Approved";

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Detalle de Reserva</h1>
                    <div className="mt-1">{getStatusBadge(booking.status)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Información General</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Instalación</p>
                                <p className="font-semibold text-base">{booking.facilityName}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Home className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Unidad</p>
                                <p className="font-medium">{booking.unitNumber || "No especificada"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Inicio</p>
                                <p className="font-medium text-[15px]">{formatDateTime(booking.startAtUtc)}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Término</p>
                                <p className="font-medium text-[15px]">{formatDateTime(booking.endAtUtc)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Comentarios y Resoluciones</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Notas adjuntas</p>
                                <p className="text-sm mt-1">{booking.notes || <span className="text-muted-foreground italic">"Sin comentarios adicionales."</span>}</p>
                            </div>

                            {booking.rejectReason && (
                                <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-200 dark:border-red-900">
                                    <p className="text-sm font-semibold text-red-800 dark:text-red-400 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Motivo de Rechazo
                                    </p>
                                    <p className="text-sm mt-1 text-red-700 dark:text-red-300">{booking.rejectReason}</p>
                                </div>
                            )}

                            {booking.cancelReason && (
                                <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-md border border-orange-200 dark:border-orange-900">
                                    <p className="text-sm font-semibold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Motivo de Cancelación
                                    </p>
                                    <p className="text-sm mt-1 text-orange-700 dark:text-orange-300">{booking.cancelReason}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {booking.charges && booking.charges.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Cargos Asociados</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {booking.charges.map((charge: any, idx: number) => (
                                        <li key={idx} className="flex justify-between items-center text-sm border-b pb-3 last:border-0 last:pb-0">
                                            <span>{charge.description || "Cargo asociado"}</span>
                                            <span className="font-semibold">${charge.amountClp}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {isPendingAdminFlow && (
                        <Card className="border-primary/50 border-2 shadow-sm bg-primary/5">
                            <CardContent className="p-4">
                                <p className="font-semibold text-primary mb-3 text-center sm:text-left">Gestión de Aprobación</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button 
                                        className="w-full bg-green-600 hover:bg-green-700 text-white" 
                                        onClick={() => approveMutation.mutate()}
                                        disabled={approveMutation.isPending || rejectMutation.isPending}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Aprobar
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        className="w-full" 
                                        onClick={() => setRejectDialogOpen(true)}
                                        disabled={approveMutation.isPending || rejectMutation.isPending}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Rechazar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {isApprovedAdminFlow && (
                        <Card className="border-blue-500/50 border-2 shadow-sm bg-blue-500/5 dark:bg-blue-900/10 dark:border-blue-900">
                            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                                <div>
                                    <p className="font-semibold text-blue-700 dark:text-blue-400">Finalizar Reserva</p>
                                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Marcar como procesada una vez terminada.</p>
                                </div>
                                <Button 
                                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto" 
                                    onClick={() => completeMutation.mutate()}
                                    disabled={completeMutation.isPending}
                                >
                                    <CheckSquare className="w-4 h-4 mr-2" />
                                    Completar
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {(!isAdminOrCommittee && canCancel) && (
                        <Card className="border-destructive/30 border-2 shadow-sm">
                            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                                <div>
                                    <p className="font-semibold text-destructive">¿Deseas cancelar?</p>
                                    <p className="text-xs text-muted-foreground">Precaución: Sujeto a políticas de multa.</p>
                                </div>
                                <Button variant="destructive" onClick={() => setCancelDialogOpen(true)}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Cancelar Reserva
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancelar Reserva Permanentemente</DialogTitle>
                        <DialogDescription>
                            Indica el motivo por el cual estás cancelando esta reserva.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder="Motivo..." 
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Volver</Button>
                        <Button variant="destructive" onClick={handleCancelSubmit} disabled={cancelMutation.isPending || !cancelReason.trim()}>
                            {cancelMutation.isPending ? "Cancelando..." : "Confirmar Cancelación"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar Reserva</DialogTitle>
                        <DialogDescription>
                            El residente será notificado del rechazo. Debe indicar estrictamente el motivo para la auditoría y transparencia.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder="Ej: Choque de uso, unidad morosa..." 
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Volver</Button>
                        <Button variant="destructive" onClick={handleRejectSubmit} disabled={rejectMutation.isPending || !rejectReason.trim()}>
                            {rejectMutation.isPending ? "Rechazando..." : "Confirmar Rechazo"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

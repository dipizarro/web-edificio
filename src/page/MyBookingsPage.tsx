import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getMyBookings } from "@/api/bookings";
import type { BookingListDto } from "@/api/bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Filter, Eye } from "lucide-react";

const getStatusBadge = (status: string) => {
    switch (status) {
        case "Approved": return <Badge className="bg-green-600">Aprobada</Badge>;
        case "PendingApproval": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
        case "Cancelled": return <Badge variant="destructive">Cancelada</Badge>;
        case "Rejected": return <Badge variant="destructive">Rechazada</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
};

export default function MyBookingsPage() {
    const navigate = useNavigate();
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [status, setStatus] = useState("All");

    const { data: bookings, isLoading, isError } = useQuery({
        queryKey: ["my-bookings", from, to, status],
        queryFn: () => getMyBookings({
            from: from || undefined,
            to: to || undefined,
            status: status !== "All" ? status : undefined
        }),
    });

    const formatDateTime = (utcStr: string) => {
        return new Date(utcStr).toLocaleString([], { 
            year: 'numeric', month: '2-digit', day: '2-digit', 
            hour: '2-digit', minute:'2-digit' 
        });
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4">
            <h1 className="text-3xl font-bold tracking-tight">Mis Reservas</h1>
            
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Filter className="w-5 h-5" /> Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Desde</label>
                            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Hasta</label>
                            <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Estado</label>
                            <Select value={status} onValueChange={(val) => setStatus(val || "All")}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">Todos</SelectItem>
                                    <SelectItem value="PendingApproval">Pendientes</SelectItem>
                                    <SelectItem value="Approved">Aprobados</SelectItem>
                                    <SelectItem value="Rejected">Rechazados</SelectItem>
                                    <SelectItem value="Cancelled">Cancelados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Cargando reservas...</div>
                    ) : isError ? (
                        <div className="p-8 text-center text-destructive">Error al cargar las reservas.</div>
                    ) : !bookings || bookings.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <CalendarIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground font-medium">No se encontraron reservas con los filtros actuales.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
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
                                            <TableCell className="font-medium">{booking.facilityName}</TableCell>
                                            <TableCell>{formatDateTime(booking.startAtUtc)}</TableCell>
                                            <TableCell>{formatDateTime(booking.endAtUtc)}</TableCell>
                                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => navigate(`/bookings/${booking.id}`)}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Ver Detalle
                                                </Button>
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
    );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getUnitStatement, downloadUnitStatementPdf } from "@/api/billing";
import { getUnits } from "@/api/units";
import { useAuth } from "@/auth/AuthProvider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatementView } from "@/components/billing/StatementView";
import { Calendar as CalendarIcon, FileSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const getCurrentYearMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function AdminStatementsPage() {
    const auth = useAuth();
    const [period, setPeriod] = useState(getCurrentYearMonth());
    const [selectedUnitId, setSelectedUnitId] = useState("");

    const { data: units, isLoading: isUnitsLoading } = useQuery({
        queryKey: ["units", auth.communityId],
        queryFn: () => getUnits(auth.communityId!),
        enabled: !!auth.communityId,
    });

    const { data: statement, isLoading: isStatementLoading, isError, error } = useQuery({
        queryKey: ["admin-statement", auth.communityId, selectedUnitId, period],
        queryFn: () => getUnitStatement(auth.communityId!, selectedUnitId, period),
        enabled: !!auth.communityId && !!selectedUnitId && !!period,
        retry: false,
    });

    const downloadMutation = useMutation({
        mutationFn: () => downloadUnitStatementPdf(auth.communityId!, selectedUnitId, period, statement?.unitNumber || "Unknown"),
        onError: () => toast.error("Error al generar el PDF del estado de cuenta de esta unidad.")
    });

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Estados de Cuenta</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Vista Administrativa Comunitaria.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-0">
                    <div className="flex items-center gap-2">
                        <Select 
                            value={selectedUnitId} 
                            onValueChange={(val) => setSelectedUnitId(val || "")} 
                            disabled={isUnitsLoading}
                        >
                            <SelectTrigger className="w-[180px] sm:w-[220px]">
                                <SelectValue placeholder={isUnitsLoading ? "Cargando Padrón..." : "Selecciona una Unidad"} />
                            </SelectTrigger>
                            <SelectContent>
                                {units?.map((u: any) => (
                                    <SelectItem key={u.id} value={u.id}>Unidad {u.number}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-transparent shadow-sm">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        <Input 
                            type="month" 
                            value={period} 
                            onChange={(e) => setPeriod(e.target.value)} 
                            className="w-auto border-0 focus-visible:ring-0 p-0 shadow-none h-7 bg-transparent"
                        />
                    </div>
                </div>
            </div>

            {!selectedUnitId ? (
                <div className="flex flex-col items-center justify-center p-12 text-center h-[40vh]">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 dark:bg-blue-900/30">
                        <FileSearch className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Buscador de Cuentas</h2>
                    <p className="text-muted-foreground max-w-md">Selecciona un departamento específico desde el panel superior para cargar automáticamente sus movimientos y adeudos.</p>
                </div>
            ) : isStatementLoading ? (
                <div className="flex p-12 justify-center text-muted-foreground">Generando proyecciones contables...</div>
            ) : isError ? (
                <div className="flex p-12 justify-center text-destructive flex-col items-center bg-destructive/5 rounded-xl border border-destructive/20 max-w-2xl mx-auto">
                    <p className="font-bold text-lg mb-1 flex items-center gap-2">
                        Error al cargar Estado de Cuenta
                    </p>
                    <p className="text-sm mt-2 text-center">{(error as any).response?.data?.message || "Es posible que la unidad no acumule gastos comunes durante este período particular o exista un salto generacional contable."}</p>
                </div>
            ) : !statement ? (
                <Card>
                    <CardContent className="flex p-12 justify-center items-center flex-col gap-3">
                        <span className="text-muted-foreground">La consulta ejecutada no arrojó información contable registrada.</span>
                    </CardContent>
                </Card>
            ) : (
                <StatementView 
                    statement={statement} 
                    isDownloadingPdf={downloadMutation.isPending} 
                    onDownloadPdf={() => downloadMutation.mutate()} 
                />
            )}
        </div>
    );
}

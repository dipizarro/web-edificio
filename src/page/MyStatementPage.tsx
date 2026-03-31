import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getMyStatement, downloadMyStatementPdf } from "@/api/billing";
import { useAuth } from "@/auth/AuthProvider";
import { Input } from "@/components/ui/input";
import { StatementView } from "@/components/billing/StatementView";
import { Calendar as CalendarIcon, WalletCards } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const getCurrentYearMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function MyStatementPage() {
    const auth = useAuth();
    const [period, setPeriod] = useState(getCurrentYearMonth());

    const { data: statement, isLoading, isError, error } = useQuery({
        queryKey: ["my-statement", auth.communityId, period],
        queryFn: () => getMyStatement(auth.communityId!, period),
        enabled: !!auth.communityId && !!period,
    });

    const downloadMutation = useMutation({
        mutationFn: () => downloadMyStatementPdf(auth.communityId!, period, statement?.unitNumber || "Unknown"),
        onError: () => toast.error("Error al generar el PDF del estado de cuenta.")
    });

    if (!auth.unitId && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mb-4 dark:bg-orange-900/30">
                    <WalletCards className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">No tienes una unidad asignada</h2>
                <p className="text-muted-foreground max-w-md">Para visualizar el estado de cuenta debes estar vinculado a una unidad dentro del condominio. Contacta a administración.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mi Estado de Cuenta</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Transacciones, Cargos Comunes y Prorrateos.</p>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <Input 
                        type="month" 
                        value={period} 
                        onChange={(e) => setPeriod(e.target.value)} 
                        className="w-auto shadow-sm"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex p-12 justify-center text-muted-foreground">Consultando registros contables...</div>
            ) : isError ? (
                <div className="flex p-12 justify-center text-destructive flex-col items-center">
                    <p className="font-bold text-lg mb-1">Error al procesar el estado de cuenta.</p>
                    <p className="text-sm">{(error as any).response?.data?.message || "Ocurrió un problema de conectividad o el período no existe."}</p>
                </div>
            ) : !statement ? (
                <Card>
                    <CardContent className="flex p-12 justify-center items-center flex-col gap-3">
                        <WalletCards className="w-12 h-12 text-muted-foreground/30" />
                        <span className="text-muted-foreground">No existe información generada para el lapso elegido.</span>
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

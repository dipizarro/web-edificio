import type { UnitStatementDto, StatementLineDto, UnitComponentDto } from "@/api/billing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt, CalendarDays, Coins, TrendingUp, TrendingDown, Percent, FileText } from "lucide-react";

interface StatementViewProps {
    statement: UnitStatementDto;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
};

const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString();
};

const getLineIcon = (type: string) => {
    if (type === "Payment" || type === "Credit") return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <TrendingUp className="w-4 h-4 text-red-600" />;
};

const getLineAmountClass = (type: string) => {
    if (type === "Payment" || type === "Credit") return "text-green-700 font-medium";
    return "text-red-700 font-medium";
};

export function StatementView({ statement }: StatementViewProps) {
    if (!statement) return null;

    const isOverdue = new Date(statement.dueDate) < new Date() && statement.totalDue > 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-primary" />
                        Estado de Cuenta: Unidad {statement.unitNumber}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" /> Período: <strong className="text-foreground">{statement.period}</strong>
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">Vencimiento</p>
                    <Badge variant={isOverdue ? "destructive" : "outline"} className={!isOverdue ? "bg-background text-primary" : ""}>
                        {formatDate(statement.dueDate)}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Anterior</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{formatCurrency(statement.previousBalance)}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Cargos del Mes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(statement.currentChargesTotal)}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Abonos / Pagos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(statement.paymentsTotal)}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-primary bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
                            <Coins className="w-4 h-4" /> Total a Pagar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-extrabold text-primary">{formatCurrency(statement.totalDue)}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Percent className="w-4 h-4" /> Coeficiente de Prorrateo
                        </CardTitle>
                        <CardDescription>
                            El total ponderado es <strong>{statement.unitTotalCoefficientPct}%</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {statement.components.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-2">Sin desglose disponible.</p>
                            ) : (
                                statement.components.map((comp: UnitComponentDto, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/20 border">
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{comp.type}</span>
                                            <span className="text-xs text-muted-foreground">Código: {comp.code}</span>
                                        </div>
                                        <Badge variant={comp.isActive ? "default" : "secondary"}>
                                            {comp.coefficientPct}%
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="w-4 h-4" /> Movimientos y Cargos ({statement.lines.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {statement.lines.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">No existen movimientos registrados en este período.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-right">Monto (CLP)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {statement.lines.map((ln: StatementLineDto, idx: number) => (
                                            <TableRow key={idx}>
                                                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                                    {formatDate(ln.date)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 text-sm font-medium">
                                                        {getLineIcon(ln.type)} {ln.type}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {ln.description}
                                                    {ln.period !== statement.period && (
                                                        <span className="ml-2 text-xs text-muted-foreground">(De: {ln.period})</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className={`text-right ${getLineAmountClass(ln.type)}`}>
                                                    {formatCurrency(ln.amount)}
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
        </div>
    );
}

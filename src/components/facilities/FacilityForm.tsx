import { useState } from "react";
import type { FacilityPayloadDto } from "@/api/facilities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Clock, DollarSign, ShieldAlert, AlignLeft, Settings } from "lucide-react";

interface FacilityFormProps {
    mode: "create" | "edit";
    initialValues?: Partial<FacilityPayloadDto>;
    onSubmit: (payload: FacilityPayloadDto) => void;
    isSubmitting: boolean;
}

const defaultValues: FacilityPayloadDto = {
    name: "",
    description: "",
    capacity: undefined,
    chargingMode: "Free",
    rentAmountClp: 0,
    depositAmountClp: 0,
    requiresApproval: true,
    slotDurationMinutes: 60,
    maxHoursPerBooking: null,
    maxBookingsPerMonthPerUnit: null,
};

export function FacilityForm({ mode, initialValues, onSubmit, isSubmitting }: FacilityFormProps) {
    const [formData, setFormData] = useState<FacilityPayloadDto>({
        ...defaultValues,
        ...initialValues,
    });

    const handleChange = (field: keyof FacilityPayloadDto, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNumberChange = (field: keyof FacilityPayloadDto, value: string) => {
        if (!value) {
            handleChange(field, null);
            return;
        }
        handleChange(field, parseInt(value, 10));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clean up financial logic defaults mapping unconditionally before posting.
        const payload = { ...formData };
        if (payload.chargingMode === "Free") {
            payload.rentAmountClp = 0;
            payload.depositAmountClp = 0;
        } else if (payload.chargingMode === "Paid") {
            payload.depositAmountClp = 0;
        } else if (payload.chargingMode === "Deposit") {
            payload.rentAmountClp = 0;
        }
        
        onSubmit(payload);
    };

    const showRent = formData.chargingMode === "Paid" || formData.chargingMode === "PaidAndDeposit";
    const showDeposit = formData.chargingMode === "Deposit" || formData.chargingMode === "PaidAndDeposit";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardContent className="pt-6 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2 border-b pb-2">
                            <Settings className="w-5 h-5" />
                            Información General
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre de la Instalación <span className="text-destructive">*</span></Label>
                                <Input 
                                    id="name"
                                    required 
                                    value={formData.name} 
                                    onChange={e => handleChange("name", e.target.value)} 
                                    placeholder="Ej. Quincho Sur" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="capacity">Capacidad Máxima (personas)</Label>
                                <Input 
                                    id="capacity"
                                    type="number"
                                    min="1"
                                    value={formData.capacity || ""} 
                                    onChange={e => handleNumberChange("capacity", e.target.value)} 
                                    placeholder="Ej. 25" 
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description" className="flex items-center gap-1.5 break-words">
                                    <AlignLeft className="w-4 h-4 text-muted-foreground" />
                                    Descripción o reglamento
                                </Label>
                                <textarea 
                                    id="description"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={formData.description || ""} 
                                    onChange={e => handleChange("description", e.target.value)} 
                                    placeholder="Información adicional sobre uso..." 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2 border-b pb-2">
                            <DollarSign className="w-5 h-5" />
                            Condiciones Comerciales
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Modalidad de Cobro</Label>
                                <Select 
                                    value={formData.chargingMode} 
                                    onValueChange={v => handleChange("chargingMode", v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Modo de Cobro" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Free">Uso Libre (Gratis)</SelectItem>
                                        <SelectItem value="Paid">Costo de Arriendo</SelectItem>
                                        <SelectItem value="Deposit">Solo Depósito (Garantía)</SelectItem>
                                        <SelectItem value="PaidAndDeposit">Arriendo + Depósito</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {showRent && (
                                <div className="space-y-2">
                                    <Label htmlFor="rentAmountClp">Costo de Alquiler (CLP) <span className="text-destructive">*</span></Label>
                                    <Input 
                                        id="rentAmountClp"
                                        type="number" 
                                        min="0"
                                        required
                                        value={formData.rentAmountClp} 
                                        onChange={e => handleNumberChange("rentAmountClp", e.target.value)} 
                                    />
                                </div>
                            )}

                            {showDeposit && (
                                <div className="space-y-2">
                                    <Label htmlFor="depositAmountClp">Depósito de Garantía (CLP) <span className="text-destructive">*</span></Label>
                                    <Input 
                                        id="depositAmountClp"
                                        type="number" 
                                        min="0"
                                        required
                                        value={formData.depositAmountClp} 
                                        onChange={e => handleNumberChange("depositAmountClp", e.target.value)} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2 border-b pb-2">
                            <Clock className="w-5 h-5" />
                            Reglas de Reserva
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="slotDurationMinutes">Duración del Turno (Minutos)</Label>
                                <Input 
                                    id="slotDurationMinutes"
                                    type="number" 
                                    min="15"
                                    step="15"
                                    required
                                    value={formData.slotDurationMinutes} 
                                    onChange={e => handleNumberChange("slotDurationMinutes", e.target.value)} 
                                />
                                <p className="text-xs text-muted-foreground">Ej: 60 (1 hora), 120 (2 horas)</p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="maxHoursPerBooking">Máx. Horas por Reserva</Label>
                                <Input 
                                    id="maxHoursPerBooking"
                                    type="number" 
                                    min="1"
                                    value={formData.maxHoursPerBooking || ""} 
                                    onChange={e => handleNumberChange("maxHoursPerBooking", e.target.value)} 
                                    placeholder="Sin límite"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="maxBookingsPerMonthPerUnit">Reservas Mensuales por Unidad</Label>
                                <Input 
                                    id="maxBookingsPerMonthPerUnit"
                                    type="number" 
                                    min="1"
                                    value={formData.maxBookingsPerMonthPerUnit || ""} 
                                    onChange={e => handleNumberChange("maxBookingsPerMonthPerUnit", e.target.value)} 
                                    placeholder="Sin límite"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-4 border-t">
                            <Checkbox 
                                id="requiresApproval" 
                                checked={formData.requiresApproval} 
                                onCheckedChange={(c: boolean | "indeterminate") => handleChange("requiresApproval", !!c)} 
                            />
                            <Label htmlFor="requiresApproval" className="flex items-center gap-1.5 cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                <ShieldAlert className="w-4 h-4 text-purple-600" />
                                Requiere aprobación de administración para confirmar reservas.
                            </Label>
                        </div>
                    </div>

                    <div className="pt-4 border-t flex justify-end gap-3">
                        <Button type="submit" disabled={isSubmitting} size="lg">
                            {isSubmitting ? "Procesando operación..." : mode === "create" ? "Registrar Infraestructura" : "Aplicar Actualizaciones"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

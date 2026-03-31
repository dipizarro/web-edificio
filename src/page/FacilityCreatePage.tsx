import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFacility } from "@/api/facilities";
import type { FacilityPayloadDto } from "@/api/facilities";
import { useAuth } from "@/auth/AuthProvider";
import { FacilityForm } from "@/components/facilities/FacilityForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function FacilityCreatePage() {
    const auth = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (payload: FacilityPayloadDto) => createFacility(auth.communityId!, payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["facilities", auth.communityId] });
            toast.success("Instalación creada y publicada exitosamente.");
            navigate(`/facilities/${data.id}`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.response?.data?.title || "Fallo en la creación de la instalación.");
        }
    });

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 border-b pb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/facilities")}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-primary" />
                        Nueva Instalación Cumunitaria
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Define las capacidades y políticas de alquiler para tu comunidad.</p>
                </div>
            </div>

            <FacilityForm 
                mode="create" 
                onSubmit={mutation.mutate} 
                isSubmitting={mutation.isPending} 
            />
        </div>
    );
}

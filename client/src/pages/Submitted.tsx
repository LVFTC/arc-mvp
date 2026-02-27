import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, FileText } from "lucide-react";

export default function Submitted() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="border-0 shadow-sm max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Avaliação concluída!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Suas respostas foram salvas com sucesso. Na próxima entrega, 
              seu relatório personalizado estará disponível para download em PDF.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 text-left space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              O que vem a seguir
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Radar de Agilidades com suas 5 dimensões</li>
              <li>Perfil Big Five detalhado</li>
              <li>Mapa IKIGAI com sua zona escolhida</li>
              <li>Mini Plano 90 dias (70/20/10) com hipóteses</li>
            </ul>
          </div>

          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            Voltar ao início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

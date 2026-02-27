import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Shield, Brain, Target, Compass } from "lucide-react";

interface WelcomeProps {
  onStart: () => void;
}

export default function Welcome({ onStart }: WelcomeProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const consentMutation = trpc.lgpd.consent.useMutation();

  const handleStart = async () => {
    if (!lgpdConsent) return;
    try {
      await consentMutation.mutateAsync({ version: "1.0" });
      onStart();
    } catch {
      onStart();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Compass className="w-4 h-4" />
            Autoconhecimento Profissional
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Arc
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Descubra suas agilidades, mapeie seu propósito e construa hipóteses de carreira com base em evidências.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <Card className="border-0 shadow-sm bg-card">
              <CardContent className="pt-6 text-center space-y-2">
                <Brain className="w-8 h-8 mx-auto text-primary" />
                <h3 className="font-semibold text-sm">CORE</h3>
                <p className="text-xs text-muted-foreground">5 dimensões de agilidade + Big Five</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-card">
              <CardContent className="pt-6 text-center space-y-2">
                <Target className="w-8 h-8 mx-auto text-primary" />
                <h3 className="font-semibold text-sm">IKIGAI</h3>
                <p className="text-xs text-muted-foreground">4 círculos do propósito ranqueados</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-card">
              <CardContent className="pt-6 text-center space-y-2">
                <Compass className="w-8 h-8 mx-auto text-primary" />
                <h3 className="font-semibold text-sm">Plano 90D</h3>
                <p className="text-xs text-muted-foreground">Hipóteses 70/20/10 para ação</p>
              </CardContent>
            </Card>
          </div>

          {/* Auth + LGPD */}
          <div className="mt-8 space-y-4 max-w-md mx-auto">
            {!isAuthenticated ? (
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => { window.location.href = getLoginUrl(); }}
              >
                Entrar para começar
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <div className="flex items-start gap-3 text-left p-4 rounded-lg bg-muted/50 border border-border">
                  <Checkbox
                    id="lgpd"
                    checked={lgpdConsent}
                    onCheckedChange={(checked) => setLgpdConsent(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="lgpd" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    <Shield className="w-3.5 h-3.5 inline mr-1 text-primary" />
                    Eu li, entendi e concordo com os{" "}
                    <span className="text-primary underline">Termos de Serviço</span> e a{" "}
                    <span className="text-primary underline">Política de Privacidade</span> do Arc.
                    Seus dados são protegidos conforme a LGPD e utilizados exclusivamente para gerar seu relatório.
                  </label>
                </div>
                <Button
                  size="lg"
                  className="w-full gap-2"
                  disabled={!lgpdConsent || consentMutation.isPending}
                  onClick={handleStart}
                >
                  {consentMutation.isPending ? "Salvando..." : "Iniciar avaliação"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Tempo estimado: 15–25 minutos
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

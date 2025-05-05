"use client"

import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WelcomeBanner() {
  return (
    <div className="relative overflow-hidden rounded-lg border bg-gradient-to-r from-violet-500/20 to-purple-500/20 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Bienvenue sur votre tableau de bord, Recruteur! 👋</h1>
        <p className="text-muted-foreground">Voici ce qui se passe avec vos candidats et vos offres aujourd'hui.</p>
        <div className="mt-4">
          <Button variant="default" className="gap-2">
            Voir les rapports
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute -bottom-16 right-16 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />
    </div>
  )
}

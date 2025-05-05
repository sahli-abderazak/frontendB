"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, DonutChart } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

type ChartData = {
  name: string
  value: number
}

interface DetailedStatsProps {
  isAdmin?: boolean
}

export function DetailedStats({ isAdmin = false }: DetailedStatsProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [candidatsParNiveau, setCandidatsParNiveau] = useState<ChartData[]>([])
  const [entretiensParStatut, setEntretiensParStatut] = useState<ChartData[]>([])
  const [candidatsParOffre, setCandidatsParOffre] = useState<ChartData[]>([])
  const [entretiensParJour, setEntretiensParJour] = useState<ChartData[]>([])

  const loadData = async () => {
    setRefreshing(true)
    try {
      const token = sessionStorage.getItem("token")
      if (!token) {
        console.error("Aucun token trouvé")
        return
      }

      if (isAdmin) {
        // Charger les données admin
        const [niveauRes, statutRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/admin/candidats-par-niveau", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://127.0.0.1:8000/api/admin/entretiens-par-statut", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        if (!niveauRes.ok || !statutRes.ok) {
          throw new Error("Erreur lors de la récupération des données")
        }

        const niveauData = await niveauRes.json()
        const statutData = await statutRes.json()

        setCandidatsParNiveau(niveauData)
        setEntretiensParStatut(statutData)
      } else {
        // Charger les données recruteur
        const [offreRes, jourRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/recruteur/candidats-par-offre", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://127.0.0.1:8000/api/recruteur/entretiens-par-jour", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        if (!offreRes.ok || !jourRes.ok) {
          throw new Error("Erreur lors de la récupération des données")
        }

        const offreData = await offreRes.json()
        const jourData = await jourRes.json()

        setCandidatsParOffre(offreData)
        setEntretiensParJour(jourData)
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [isAdmin])

  const formatLastUpdated = () => {
    return lastUpdated.toLocaleTimeString()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Statistiques Détaillées</CardTitle>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Dernière mise à jour: {formatLastUpdated()}</span>
          <Button
            onClick={loadData}
            disabled={refreshing}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Rafraîchir
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isAdmin ? (
          <Tabs defaultValue="niveau" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="niveau">Niveau d'Études</TabsTrigger>
              <TabsTrigger value="statut">Statut des Entretiens</TabsTrigger>
            </TabsList>

            <TabsContent value="niveau" className="space-y-4">
              <div className="h-[400px]">
                {candidatsParNiveau.length > 0 ? (
                  <DonutChart
                    data={candidatsParNiveau}
                    index="name"
                    category="value"
                    valueFormatter={(value) => `${value} candidats`}
                    colors={["violet", "indigo", "blue", "cyan", "teal"]}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Chargement des données...</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="statut" className="space-y-4">
              <div className="h-[400px]">
                {entretiensParStatut.length > 0 ? (
                  <DonutChart
                    data={entretiensParStatut}
                    index="name"
                    category="value"
                    valueFormatter={(value) => `${value} entretiens`}
                    colors={["emerald", "amber", "red", "blue"]}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Chargement des données...</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="offres" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="offres">Candidats par Offre</TabsTrigger>
              <TabsTrigger value="jours">Entretiens par Jour</TabsTrigger>
            </TabsList>

            <TabsContent value="offres" className="space-y-4">
              <div className="h-[400px]">
                {candidatsParOffre.length > 0 ? (
                  <BarChart
                    data={candidatsParOffre}
                    index="name"
                    categories={["value"]}
                    colors={["purple"]}
                    valueFormatter={(value) => `${value} candidats`}
                    yAxisWidth={48}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Chargement des données...</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="jours" className="space-y-4">
              <div className="h-[400px]">
                {entretiensParJour.length > 0 ? (
                  <BarChart
                    data={entretiensParJour}
                    index="name"
                    categories={["value"]}
                    colors={["green"]}
                    valueFormatter={(value) => `${value} entretiens`}
                    yAxisWidth={48}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Chargement des données...</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

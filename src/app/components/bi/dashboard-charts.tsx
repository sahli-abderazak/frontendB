"use client"

import { useState, useEffect } from "react"
import { BarChart, LineChart, DonutChart } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Type pour les données de graphique
type ChartData = {
  name: string
  value: number
}

type LineChartData = {
  name: string
  [key: string]: string | number
}

export function DashboardCharts({ isAdmin = false }) {
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [candidatsParDepartement, setCandidatsParDepartement] = useState<ChartData[]>([])
  const [candidatsParMois, setCandidatsParMois] = useState<LineChartData[]>([])
  const [offresParDepartement, setOffresParDepartement] = useState<ChartData[]>([])
  const [entretiensParStatut, setEntretiensParStatut] = useState<ChartData[]>([])

  // Fonction pour charger les données
  const loadData = async () => {
    setRefreshing(true)
    try {
      const token = sessionStorage.getItem("token")
      if (!token) {
        console.error("Aucun token trouvé")
        return
      }

      const prefix = isAdmin ? "admin" : "recruteur"

      // Charger les données depuis les API
      const [deptRes, moisRes, offresDeptRes, statutRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/${prefix}/candidats-par-departement`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`http://127.0.0.1:8000/api/${prefix}/candidats-par-mois`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`http://127.0.0.1:8000/api/${prefix}/offres-par-departement`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`http://127.0.0.1:8000/api/${prefix}/entretiens-par-statut`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      if (!deptRes.ok || !moisRes.ok || !offresDeptRes.ok || !statutRes.ok) {
        throw new Error("Erreur lors de la récupération des données")
      }

      const deptData = await deptRes.json()
      const moisData = await moisRes.json()
      const offresDeptData = await offresDeptRes.json()
      const statutData = await statutRes.json()

      setCandidatsParDepartement(deptData)
      setCandidatsParMois(moisData)
      setOffresParDepartement(offresDeptData)
      setEntretiensParStatut(statutData)

      setLastUpdated(new Date())
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setRefreshing(false)
    }
  }

  // Charger les données au chargement du composant
  useEffect(() => {
    loadData()
  }, [isAdmin])

  const formatLastUpdated = () => {
    return lastUpdated.toLocaleTimeString()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Statistiques des Candidats</CardTitle>
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
        <Tabs defaultValue="departements" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="departements">Par Département</TabsTrigger>
            <TabsTrigger value="tendances">Tendances</TabsTrigger>
            <TabsTrigger value="offres">Offres</TabsTrigger>
            <TabsTrigger value="statuts">Statuts Entretiens</TabsTrigger>
          </TabsList>

          <TabsContent value="departements" className="space-y-4">
            <div className="h-[300px]">
              {candidatsParDepartement.length > 0 ? (
                <BarChart
                  data={candidatsParDepartement}
                  index="name"
                  categories={["value"]}
                  colors={["violet"]}
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

          <TabsContent value="tendances" className="space-y-4">
            <div className="h-[300px]">
              {candidatsParMois.length > 0 ? (
                <LineChart
                  data={candidatsParMois}
                  index="name"
                  categories={["Candidats"]}
                  colors={["green"]}
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

          <TabsContent value="offres" className="space-y-4">
            <div className="h-[300px]">
              {offresParDepartement.length > 0 ? (
                <BarChart
                  data={offresParDepartement}
                  index="name"
                  categories={["value"]}
                  colors={["blue"]}
                  valueFormatter={(value) => `${value} offres`}
                  yAxisWidth={48}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Chargement des données...</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="statuts" className="space-y-4">
            <div className="h-[300px]">
              {entretiensParStatut.length > 0 ? (
                <DonutChart
                  data={entretiensParStatut}
                  index="name"
                  category="value"
                  valueFormatter={(value) => `${value} entretiens`}
                  colors={["violet", "indigo", "emerald", "amber"]}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Chargement des données...</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

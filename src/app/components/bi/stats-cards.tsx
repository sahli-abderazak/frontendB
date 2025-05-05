"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart } from "@/components/ui/chart"
import { Users, Briefcase, CheckCircle, Clock } from "lucide-react"

type StatsData = {
  totalCandidats: number
  totalOffres: number
  totalEntretiens: number
  totalRecruteurs: number
  candidatsTendance: { name: string; value: number }[]
  offresTendance: { name: string; value: number }[]
  entretiensTendance: { name: string; value: number }[]
}

type RecruteurStatsData = {
  totalMesCandidats: number
  totalMesOffres: number
  totalMesEntretiens: number
  entretiensPending: number
  candidatsTendance: { name: string; value: number }[]
  entretiensTendance: { name: string; value: number }[]
}

interface StatsCardsProps {
  isAdmin?: boolean
}

export function StatsCards({ isAdmin = false }: StatsCardsProps) {
  const [stats, setStats] = useState<StatsData | RecruteurStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = sessionStorage.getItem("token")
        if (!token) {
          console.error("Aucun token trouvé")
          return
        }

        const endpoint = isAdmin ? "http://127.0.0.1:8000/api/admin/stats" : "http://127.0.0.1:8000/api/recruteur/stats"

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des statistiques")
        }

        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isAdmin])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chargement...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Chargement des données...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  if (isAdmin) {
    const adminStats = stats as StatsData
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalCandidats}</div>
            <p className="text-xs text-muted-foreground">Candidats enregistrés</p>
            <div className="h-[80px] mt-2">
              {adminStats.candidatsTendance && adminStats.candidatsTendance.length > 0 && (
                <BarChart
                  data={adminStats.candidatsTendance}
                  index="name"
                  categories={["value"]}
                  colors={["violet"]}
                  showXAxis={false}
                  showYAxis={false}
                  showLegend={false}
                  showGridLines={false}
                  startEndOnly={false}
                  showAnimation={true}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offres Actives</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalOffres}</div>
            <p className="text-xs text-muted-foreground">Offres publiées</p>
            <div className="h-[80px] mt-2">
              {adminStats.offresTendance && adminStats.offresTendance.length > 0 && (
                <BarChart
                  data={adminStats.offresTendance}
                  index="name"
                  categories={["value"]}
                  colors={["green"]}
                  showXAxis={false}
                  showYAxis={false}
                  showLegend={false}
                  showGridLines={false}
                  startEndOnly={false}
                  showAnimation={true}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entretiens</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalEntretiens}</div>
            <p className="text-xs text-muted-foreground">Entretiens planifiés</p>
            <div className="h-[80px] mt-2">
              {adminStats.entretiensTendance && adminStats.entretiensTendance.length > 0 && (
                <BarChart
                  data={adminStats.entretiensTendance}
                  index="name"
                  categories={["value"]}
                  colors={["blue"]}
                  showXAxis={false}
                  showYAxis={false}
                  showLegend={false}
                  showGridLines={false}
                  startEndOnly={false}
                  showAnimation={true}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recruteurs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalRecruteurs}</div>
            <p className="text-xs text-muted-foreground">Recruteurs actifs</p>
            <div className="h-[80px] mt-2"></div>
          </CardContent>
        </Card>
      </div>
    )
  } else {
    const recruteurStats = stats as RecruteurStatsData
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mes Candidats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recruteurStats.totalMesCandidats}</div>
            <p className="text-xs text-muted-foreground">Candidats pour vos offres</p>
            <div className="h-[80px] mt-2">
              {recruteurStats.candidatsTendance && recruteurStats.candidatsTendance.length > 0 && (
                <BarChart
                  data={recruteurStats.candidatsTendance}
                  index="name"
                  categories={["value"]}
                  colors={["violet"]}
                  showXAxis={false}
                  showYAxis={false}
                  showLegend={false}
                  showGridLines={false}
                  startEndOnly={false}
                  showAnimation={true}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mes Offres</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recruteurStats.totalMesOffres}</div>
            <p className="text-xs text-muted-foreground">Offres publiées</p>
            <div className="h-[80px] mt-2"></div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mes Entretiens</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recruteurStats.totalMesEntretiens}</div>
            <p className="text-xs text-muted-foreground">Entretiens planifiés</p>
            <div className="h-[80px] mt-2">
              {recruteurStats.entretiensTendance && recruteurStats.entretiensTendance.length > 0 && (
                <BarChart
                  data={recruteurStats.entretiensTendance}
                  index="name"
                  categories={["value"]}
                  colors={["blue"]}
                  showXAxis={false}
                  showYAxis={false}
                  showLegend={false}
                  showGridLines={false}
                  startEndOnly={false}
                  showAnimation={true}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recruteurStats.entretiensPending}</div>
            <p className="text-xs text-muted-foreground">Entretiens en attente</p>
            <div className="h-[80px] mt-2"></div>
          </CardContent>
        </Card>
      </div>
    )
  }
}

"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, Video } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type Interview = {
  id: number
  candidat_nom: string
  candidat_prenom: string
  poste: string
  date_heure: string
  type: string
  lien_ou_adresse: string
  status: string
}

export function UpcomingInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const token = sessionStorage.getItem("token")
        if (!token) {
          console.error("Aucun token trouvé")
          return
        }

        const response = await fetch("http://127.0.0.1:8000/api/recruteur/mes-entretiens", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des entretiens")
        }

        const data = await response.json()
        // Filtrer pour obtenir uniquement les entretiens à venir (status: pending)
        const upcomingInterviews = data.filter((interview: any) => interview.status === "pending").slice(0, 3) // Limiter à 3 entretiens

        setInterviews(upcomingInterviews)
      } catch (error) {
        console.error("Erreur:", error)
        // Utiliser des données de démonstration en cas d'erreur
        setInterviews([
          {
            id: 1,
            candidat_nom: "Dupont",
            candidat_prenom: "Marie",
            poste: "Développeur Frontend",
            date_heure: "2025-05-06T10:00:00",
            type: "video",
            lien_ou_adresse: "https://meet.google.com/abc-defg-hij",
            status: "pending",
          },
          {
            id: 2,
            candidat_nom: "Martin",
            candidat_prenom: "Thomas",
            poste: "Data Scientist",
            date_heure: "2025-05-07T14:30:00",
            type: "presentiel",
            lien_ou_adresse: "10 Rue de la Paix, Paris",
            status: "pending",
          },
          {
            id: 3,
            candidat_nom: "Lefebvre",
            candidat_prenom: "Julie",
            poste: "Chef de Projet IT",
            date_heure: "2025-05-08T11:15:00",
            type: "video",
            lien_ou_adresse: "https://zoom.us/j/123456789",
            status: "pending",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchInterviews()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            En attente
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Terminé
          </Badge>
        )
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Entretiens à venir</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : interviews.length > 0 ? (
          <div className="space-y-4">
            {interviews.map((interview, index) => (
              <div key={interview.id} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {interview.candidat_prenom} {interview.candidat_nom}
                    </h3>
                    <p className="text-sm text-muted-foreground">{interview.poste}</p>
                  </div>
                  <div>{getStatusBadge(interview.status)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(interview.date_heure)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatTime(interview.date_heure)}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    {interview.type === "video" ? (
                      <>
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{interview.lien_ou_adresse}</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{interview.lien_ou_adresse}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="w-full">
                    Voir détails
                  </Button>
                  {interview.type === "video" && (
                    <Button size="sm" className="w-full">
                      Rejoindre
                    </Button>
                  )}
                </div>

                {index < interviews.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucun entretien à venir</p>
          </div>
        )}

        <div className="mt-4 text-center">
          <Button variant="link">Voir tous les entretiens</Button>
        </div>
      </CardContent>
    </Card>
  )
}

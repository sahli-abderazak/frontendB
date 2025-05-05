"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { StatsCards } from "../components/bi/stats-cards"
import { DashboardCharts } from "../components/bi/dashboard-charts"
import { DetailedStats } from "../components/bi/detailed-stats"
import { UpcomingInterviews } from "../components/bi/upcoming-interviews"
import { WelcomeBanner } from "../components/recruteur/welcome-banner_rec"
import { DashboardSidebarRec } from "../components/recruteur/dashboard-sidebar_rec"
import { DashboardHeaderRec } from "../components/recruteur/dashboard-header_rec"

export default function RecruiterDashboard() {
  const router = useRouter()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // Vérifier le rôle de l'utilisateur avant de rendre la page
    const checkUserRole = async () => {
      try {
        const token = sessionStorage.getItem("token")
        if (!token) {
          // Rediriger vers la page de connexion si pas de token
          router.push("/")
          return
        }

        const response = await fetch("http://127.0.0.1:8000/api/users/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des données")
        }

        const userData = await response.json()

        // Si l'utilisateur est un recruteur, autoriser le rendu de la page
        if (userData.role === "recruteur") {
          setShouldRender(true)
        } else {
          // Si autre rôle, rediriger vers la page d'accueil
          router.push("/dashboard/admin")
        }
      } catch (error) {
        console.error("Erreur:", error)
        // En cas d'erreur, rediriger vers la page d'accueil
        router.push("/")
      }
    }

    checkUserRole()
  }, [router])

  // Ne rien afficher jusqu'à ce que la vérification soit terminée
  if (!shouldRender) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <DashboardHeaderRec />
      <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Sidebar - visible on desktop, hidden on mobile (handled by MobileSidebar) */}
          <div className="hidden md:block md:col-span-1 lg:col-span-1">
            <div className="sticky top-20">
              <DashboardSidebarRec />
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-5 lg:col-span-5 space-y-6">
            {/* Welcome Banner */}
            <WelcomeBanner />

            {/* Stats Cards */}
            <div className="grid gap-6">
              <StatsCards isAdmin={false} />
            </div>

            {/* Upcoming Interviews */}
            <div className="grid gap-6">
              <UpcomingInterviews />
            </div>

            {/* Charts Section */}
            <div className="grid gap-6">
              <DashboardCharts isAdmin={false} />
            </div>

            {/* Detailed Stats Section */}
            <div className="grid gap-6">
              <DetailedStats isAdmin={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, Clock, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import TestSecurity from "./test-security"

// Ajouter ces imports en haut du fichier
import { useState, useEffect, useRef, useCallback } from "react"

interface Option {
  text: string
  score: number
}

interface TestQuestion {
  trait: string
  question: string
  options: Option[]
}

interface PersonalityTestProps {
  candidatId: number
  offreId: number
  onTestComplete?: () => void
}

// Ajouter cette fonction après les imports mais avant le composant
function generateTestId(candidatId: number, offreId: number) {
  return `test_${candidatId}_${offreId}_${new Date().toISOString().split("T")[0]}`
}

const PersonalityTest: React.FC<PersonalityTestProps> = ({ candidatId, offreId, onTestComplete }) => {
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<Option | null>(null)
  const [totalScore, setTotalScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testCompleted, setTestCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<(Option | null)[]>([])
  const [testStage, setTestStage] = useState<"qcm" | "image" | "completed" | "timeout">("qcm")
  const [personalityAnalysis, setPersonalityAnalysis] = useState<string | null>(null)
  const [securityViolations, setSecurityViolations] = useState<Record<string, number>>({})
  const [testForcedToEnd, setTestForcedToEnd] = useState(false)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  // Ajouter ces états dans le composant PersonalityTest
  const [testId, setTestId] = useState<string | null>(null)
  const [cheatingDetected, setCheatingDetected] = useState(false)

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(10 * 60) // 10 minutes in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Use refs to track initialization state and prevent multiple API calls
  const isInitialRender = useRef(true)
  const questionsInitialized = useRef(false)
  const apiCallInProgress = useRef(false)

  // Initialize timer when component mounts
  useEffect(() => {
    // Start the timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - clear interval and set timeout state
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }
          // Set timeout state which will trigger the timeout UI
          setTestStage("timeout")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Clear timer when test is completed
  useEffect(() => {
    if (testStage === "completed" && timerRef.current) {
      clearInterval(timerRef.current)
    }
  }, [testStage])

  // Fetch questions when component mounts
  useEffect(() => {
    if (!apiCallInProgress.current && !questionsInitialized.current) {
      fetchQuestions()
    }
  }, [candidatId, offreId])

  // Initialize answers array when questions are loaded
  useEffect(() => {
    if (questions.length > 0 && !questionsInitialized.current) {
      console.log("Initializing answers array for the first time")
      setAnswers(new Array(questions.length).fill(null))
      questionsInitialized.current = true
    }
  }, [questions])

  // Modifier l'effet qui met à jour l'option sélectionnée lors du changement de question
  // Remplacer l'effet existant par celui-ci:
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      console.log(`Updating selected option for question ${currentQuestionIndex}`)
      const savedAnswer = answers[currentQuestionIndex]

      // Si une réponse existe pour cette question, la définir comme option sélectionnée
      if (savedAnswer) {
        // Trouver l'option correspondante dans les options de la question actuelle
        const currentQuestionOptions = questions[currentQuestionIndex].options
        const matchingOption = currentQuestionOptions.find(
          (option) => option.text === savedAnswer.text && option.score === savedAnswer.score,
        )

        // Si une option correspondante est trouvée, la définir comme sélectionnée
        if (matchingOption) {
          setSelectedOption(matchingOption)
        } else {
          setSelectedOption(savedAnswer) // Fallback au cas où
        }
      } else {
        // Aucune réponse pour cette question, réinitialiser l'option sélectionnée
        setSelectedOption(null)
      }
    }
  }, [currentQuestionIndex, answers, questions])

  // Format time remaining as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Remplacer la fonction fetchQuestions par celle-ci
  const fetchQuestions = async () => {
    // Prevent multiple simultaneous API calls
    if (apiCallInProgress.current) {
      console.log("API call already in progress, skipping duplicate fetch")
      return
    }

    try {
      apiCallInProgress.current = true
      setLoading(true)
      setError(null)
      console.log(`Récupération des questions pour candidat ID: ${candidatId}, offre ID: ${offreId}`)

      // Ensure IDs are numbers
      const candidatIdNumber = Number(candidatId)
      const offreIdNumber = Number(offreId)

      if (isNaN(candidatIdNumber) || isNaN(offreIdNumber)) {
        throw new Error("IDs de candidat ou d'offre invalides")
      }

      // Check if the candidate has already completed the test for this offer

      // Le reste de la fonction reste inchangé...
      // Générer un ID de test unique basé sur le candidat et l'offre
      const generatedTestId = generateTestId(candidatIdNumber, offreIdNumber)

      // Vérifier si un test existe déjà dans le localStorage
      const savedTest = localStorage.getItem(`personality_test_${generatedTestId}`)

      if (savedTest) {
        // Récupérer le test sauvegardé
        const parsedTest = JSON.parse(savedTest)
        console.log("Test existant trouvé dans le localStorage:", generatedTestId)

        setTestId(generatedTestId)
        setQuestions(parsedTest.questions)

        // Si des réponses existent, les restaurer
        if (parsedTest.answers && Array.isArray(parsedTest.answers)) {
          setAnswers(parsedTest.answers)

          // Définir l'option sélectionnée pour la question actuelle (qui est 0 au démarrage)
          if (parsedTest.answers[0]) {
            setSelectedOption(parsedTest.answers[0])
          }
        }

        setLoading(false)
        apiCallInProgress.current = false
        return
      }

      // Aucun test existant, générer un nouveau
      const response = await fetch(`http://127.0.0.1:8000/api/generate-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidat_id: candidatIdNumber,
          offre_id: offreIdNumber,
        }),
      })

      if (!response.ok) {
        // Vérifier si l'erreur est due à un test déjà complété
        if (response.status === 403) {
          const errorData = await response.json()

          // Vérifier explicitement si l'erreur mentionne une triche détectée
          if (
            errorData.error &&
            (errorData.error.includes("triche détectée") || errorData.error.includes("Test bloqué : triche"))
          ) {
            // Afficher un message de triche détectée
            setTestStage("completed")
            setTestCompleted(true)
            setCheatingDetected(true)
            setLoading(false)
            apiCallInProgress.current = false
            return
          }

          if (errorData.error && errorData.error.includes("déjà passé le test")) {
            // Afficher un message personnalisé et arrêter le chargement du test
            setTestStage("completed") // Utiliser l'état "completed" pour afficher un message personnalisé
            setTestCompleted(true)
            setPersonalityAnalysis(
              `Vous avez déjà passé ce test. ${errorData.score ? `Votre score est de ${errorData.score}.` : ""}`,
            )
            setLoading(false)
            apiCallInProgress.current = false
            return
          }
        }

        const errorText = await response.text()
        console.error(`Erreur HTTP: ${response.status}, message: ${errorText}`)
        throw new Error(`Erreur lors de la récupération des questions: ${response.status}`)
      }

      const data = await response.json()
      console.log("Questions reçues:", data)

      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions)
        setTestId(generatedTestId)

        // Sauvegarder le test dans le localStorage immédiatement
        localStorage.setItem(
          `personality_test_${generatedTestId}`,
          JSON.stringify({
            questions: data.questions,
            answers: new Array(data.questions.length).fill(null),
            startTime: new Date().toISOString(),
            status: "in_progress",
          }),
        )
      } else {
        throw new Error("Format de réponse invalide ou aucune question trouvée")
      }
    } catch (error) {
      console.error(`Erreur: ${error instanceof Error ? error.message : String(error)}`)
      setError("Impossible de charger les questions du test. Veuillez réessayer.")
    } finally {
      setLoading(false)
      apiCallInProgress.current = false
    }
  }

  // Ajouter cette fonction pour sauvegarder l'état du test
  const saveTestState = useCallback(() => {
    if (!testId || questions.length === 0) return

    localStorage.setItem(
      `personality_test_${testId}`,
      JSON.stringify({
        questions,
        answers,
        lastUpdated: new Date().toISOString(),
        status: "in_progress",
      }),
    )

    console.log("État du test sauvegardé dans le localStorage")
  }, [testId, questions, answers])

  // Modifier la fonction handleOptionSelect pour sauvegarder après chaque sélection
  const handleOptionSelect = (option: Option) => {
    // Store the answer in the answers array
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = option
    setAnswers(newAnswers)

    // Update selected option for display
    setSelectedOption(option)
    setError(null)

    // Sauvegarder l'état après chaque sélection
    setTimeout(() => {
      localStorage.setItem(
        `personality_test_${testId}`,
        JSON.stringify({
          questions,
          answers: newAnswers,
          lastUpdated: new Date().toISOString(),
          status: "in_progress",
        }),
      )
    }, 0)
  }

  // Modifier la fonction goToNextQuestion pour sauvegarder l'état
  const goToNextQuestion = () => {
    if (!selectedOption) {
      setError("Veuillez sélectionner une réponse.")
      return
    }

    // Store the current answer
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = selectedOption
    setAnswers(newAnswers)

    // Sauvegarder l'état
    localStorage.setItem(
      `personality_test_${testId}`,
      JSON.stringify({
        questions,
        answers: newAnswers,
        lastUpdated: new Date().toISOString(),
        status: "in_progress",
      }),
    )

    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Calculate final score from all answers
      const finalScore = newAnswers.reduce((total, answer) => total + (answer ? answer.score : 0), 0)
      setTotalScore(finalScore)
      submitQcmTest()
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setError(null)
    }
  }

  // Modifier la fonction submitQcmTest pour marquer le test comme terminé dans localStorage
  const submitQcmTest = async () => {
    try {
      setSubmitting(true)

      // Marquer le test comme terminé dans localStorage
      if (testId) {
        localStorage.setItem(
          `personality_test_${testId}`,
          JSON.stringify({
            questions,
            answers,
            lastUpdated: new Date().toISOString(),
            status: "completed",
          }),
        )
      }

      // Préparer les données des réponses pour le stockage
      const answersData = answers
        .map((answer, index) => {
          if (!answer) return null

          // Trouver l'index de l'option sélectionnée
          const optionIndex = questions[index].options.findIndex(
            (opt) => opt.text === answer.text && opt.score === answer.score,
          )

          return {
            question_index: index,
            selected_option_index: optionIndex !== -1 ? optionIndex : 0,
            score: answer.score,
          }
        })
        .filter((a) => a !== null)

      // Le reste de la fonction reste inchangé...
      // Ensure we have valid IDs
      const candidatIdNumber = Number(candidatId)
      const offreIdNumber = Number(offreId)

      if (isNaN(candidatIdNumber) || isNaN(offreIdNumber)) {
        throw new Error("Identifiants de candidat ou d'offre invalides")
      }

      console.log(`Envoi du score pour candidat ID: ${candidatIdNumber}, offre ID: ${offreIdNumber}`)

      // Nous n'avons plus besoin de calculer les scores ici, le backend s'en chargera
      // avec la nouvelle formule de pourcentage
      const storeScoreResponse = await fetch(`http://127.0.0.1:8000/api/store-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidat_id: candidatIdNumber,
          offre_id: offreIdNumber,
          score_total: totalScore,
          questions: questions, // Envoyer toutes les questions
          answers: answersData, // Envoyer toutes les réponses avec les index
        }),
      })

      if (!storeScoreResponse.ok) {
        const errorData = await storeScoreResponse.json()
        throw new Error(errorData.error || `Erreur HTTP ${storeScoreResponse.status}`)
      }

      const data = await storeScoreResponse.json()
      console.log(`Score enregistré avec succès:`, data)

      // Move directly to completed stage
      setTestStage("completed")
      setTestCompleted(true)

      // Call onTestComplete callback if provided
      if (onTestComplete) {
        onTestComplete()
      }
    } catch (error) {
      console.error(`Erreur: ${error instanceof Error ? error.message : String(error)}`)
      setError(`Erreur lors de l'enregistrement du score: ${error instanceof Error ? error.message : String(error)}`)

      // Even if there's an error, move to completed stage after a delay
      setTimeout(() => {
        setTestStage("completed")
      }, 2000)
    } finally {
      setSubmitting(false)
    }
  }

  // Ajouter une fonction pour vérifier si le test doit être forcé à se terminer
  const checkForForcedEnd = (violations: Record<string, number>) => {
    // Vérifier si un type de violation a atteint ou dépassé 2 occurrences
    const shouldForceEnd = Object.values(violations).some((count) => count >= 2)

    if (shouldForceEnd && !testForcedToEnd) {
      setTestForcedToEnd(true)
      // Enregistrer le score avec le statut "forced_end"
      submitForcedEndTest(violations)
    }
  }

  // Ajouter une fonction pour soumettre le test en cas de fin forcée
  const submitForcedEndTest = async (violations: Record<string, number>) => {
    try {
      setSubmitting(true)

      // Préparer les données des réponses pour le stockage
      const answersData = answers
        .map((answer, index) => {
          if (!answer) return null

          // Trouver l'index de l'option sélectionnée
          const optionIndex = questions[index]?.options.findIndex(
            (opt) => opt.text === answer.text && opt.score === answer.score,
          )

          return {
            question_index: index,
            selected_option_index: optionIndex !== -1 ? optionIndex : 0,
            score: answer.score,
          }
        })
        .filter((a) => a !== null)

      // Calculer le score total des réponses données
      const currentTotalScore = answers.reduce((total, answer) => total + (answer ? answer.score : 0), 0)

      // Ensure we have valid IDs
      const candidatIdNumber = Number(candidatId)
      const offreIdNumber = Number(offreId)

      if (isNaN(candidatIdNumber) || isNaN(offreIdNumber)) {
        throw new Error("Identifiants de candidat ou d'offre invalides")
      }

      console.log(`Envoi du score forcé pour candidat ID: ${candidatIdNumber}, offre ID: ${offreIdNumber}`)

      // Utiliser la même API que pour les tests terminés avec succès
      const storeScoreResponse = await fetch(`http://127.0.0.1:8000/api/store-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidat_id: candidatIdNumber,
          offre_id: offreIdNumber,
          score_total: currentTotalScore,
          questions: questions,
          answers: answersData,
          status: "forced_end", // Indiquer que le test a été forcé à se terminer
          security_violations: violations,
        }),
      })

      if (!storeScoreResponse.ok) {
        const errorData = await storeScoreResponse.json()
        throw new Error(errorData.error || `Erreur HTTP ${storeScoreResponse.status}`)
      }

      const data = await storeScoreResponse.json()
      console.log(`Score forcé enregistré avec succès:`, data)

      // Passer à l'étape terminée
      setTestStage("completed")
      setTestCompleted(true)

      // Appeler le callback onTestComplete si fourni
      if (onTestComplete) {
        onTestComplete()
      }
    } catch (error) {
      console.error(`Erreur: ${error instanceof Error ? error.message : String(error)}`)
      setError(
        `Erreur lors de l'enregistrement du score forcé: ${error instanceof Error ? error.message : String(error)}`,
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleRatingSubmit = async (score: number) => {
    setSelectedRating(score)

    try {
      // Ensure we have valid IDs
      const candidatIdNumber = Number(candidatId)
      const offreIdNumber = Number(offreId)

      if (isNaN(candidatIdNumber) || isNaN(offreIdNumber)) {
        console.error("Identifiants de candidat ou d'offre invalides")
        return
      }

      // Call the API to store the rating
      const response = await fetch(`http://127.0.0.1:8000/api/offre-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offre_id: offreIdNumber,
          candidat_id: candidatIdNumber,
          score: score,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Erreur lors de l'enregistrement de l'évaluation:", errorData)
        return
      }

      // Show confirmation message
      setRatingSubmitted(true)
      console.log("Évaluation enregistrée avec succès")
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'évaluation:", error)
    }
  }

  // Modifier la fonction navigateToQuestion pour sauvegarder la réponse actuelle avant de naviguer
  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      // Sauvegarder la réponse actuelle avant de naviguer
      if (selectedOption) {
        const newAnswers = [...answers]
        newAnswers[currentQuestionIndex] = selectedOption
        setAnswers(newAnswers)

        // Sauvegarder dans localStorage
        if (testId) {
          localStorage.setItem(
            `personality_test_${testId}`,
            JSON.stringify({
              questions,
              answers: newAnswers,
              lastUpdated: new Date().toISOString(),
              status: "in_progress",
            }),
          )
        }
      }

      setCurrentQuestionIndex(index)
      setError(null)
    }
  }

  // Modifier le gestionnaire de violations de sécurité pour vérifier si le test doit être forcé à se terminer
  const handleSecurityViolation = (type: string, count: number) => {
    const updatedViolations = {
      ...securityViolations,
      [type]: count,
    }

    setSecurityViolations(updatedViolations)

    // Vérifier si le test doit être forcé à se terminer
    checkForForcedEnd(updatedViolations)

    // Log the violation to the console
    console.log(`Security violation: ${type}, count: ${count}`)
  }

  // Ajouter un effet pour gérer la fermeture de la fenêtre
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Si le test n'est pas encore terminé, enregistrer le score
      if (!testCompleted && !testForcedToEnd && testStage !== "timeout") {
        // Calculer le score actuel
        const currentTotalScore = answers.reduce((total, answer) => total + (answer ? answer.score : 0), 0)

        // Envoyer une requête pour enregistrer le score en utilisant l'API existante
        navigator.sendBeacon(
          "http://127.0.0.1:8000/api/score-zero",
          JSON.stringify({
            candidat_id: candidatId,
            offre_id: offreId,
            score_total: currentTotalScore,
            questions: questions,
            answers: answers
              .map((answer, index) => {
                if (!answer) return null
                const optionIndex = questions[index]?.options.findIndex(
                  (opt) => opt.text === answer.text && opt.score === answer.score,
                )
                return {
                  question_index: index,
                  selected_option_index: optionIndex !== -1 ? optionIndex : 0,
                  score: answer.score,
                }
              })
              .filter((a) => a !== null),
            status: "abandoned", // Indiquer que le test a été abandonné
            security_violations: securityViolations,
          }),
        )
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [testCompleted, testForcedToEnd, testStage, answers, questions, candidatId, offreId, securityViolations])

  // Ajouter un effet pour nettoyer les tests terminés ou expirés
  useEffect(() => {
    // Fonction pour nettoyer les tests anciens
    const cleanupOldTests = () => {
      const now = new Date()
      const keys = Object.keys(localStorage)

      keys.forEach((key) => {
        if (key.startsWith("personality_test_")) {
          try {
            const testData = JSON.parse(localStorage.getItem(key) || "{}")

            // Si le test est terminé ou a plus de 24h, le supprimer
            if (testData.status === "completed" || testData.status === "abandoned") {
              // Garder les tests terminés pendant 1 heure seulement
              const lastUpdated = new Date(testData.lastUpdated || testData.startTime)
              const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)

              if (hoursSinceUpdate > 1) {
                localStorage.removeItem(key)
                console.log(`Test nettoyé: ${key}`)
              }
            } else if (testData.startTime) {
              // Pour les tests en cours, vérifier s'ils sont trop vieux (24h)
              const startTime = new Date(testData.startTime)
              const hoursSinceStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60)

              if (hoursSinceStart > 24) {
                localStorage.removeItem(key)
                console.log(`Test expiré nettoyé: ${key}`)
              }
            }
          } catch (e) {
            console.error(`Erreur lors du nettoyage du test ${key}:`, e)
          }
        }
      })
    }

    // Nettoyer les tests au chargement
    cleanupOldTests()

    // Nettoyer les tests toutes les heures
    const cleanupInterval = setInterval(cleanupOldTests, 60 * 60 * 1000)

    return () => clearInterval(cleanupInterval)
  }, [])

  // Ajouter un effet pour sauvegarder périodiquement l'état du test
  useEffect(() => {
    if (!testId || testCompleted || testForcedToEnd) return

    // Sauvegarder l'état toutes les 30 secondes
    const autoSaveInterval = setInterval(() => {
      if (questions.length > 0) {
        localStorage.setItem(
          `personality_test_${testId}`,
          JSON.stringify({
            questions,
            answers,
            lastUpdated: new Date().toISOString(),
            status: "in_progress",
          }),
        )
        console.log("Sauvegarde automatique effectuée")
      }
    }, 30000)

    return () => clearInterval(autoSaveInterval)
  }, [testId, questions, answers, testCompleted, testForcedToEnd])

  // Fonction pour afficher le message de triche détectée
  const renderCheatingDetectedMessage = () => {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-red-200">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 flex flex-col items-center justify-center text-white">
            <div className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                <Shield className="h-10 w-10 text-white relative z-10" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center">Test bloqué : Triche détectée</h2>
            <p className="text-white/80 text-center mt-2">Vous n'êtes pas autorisé à repasser ce test</p>
          </div>

          <div className="p-6">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nous avons détecté des comportements suspects lors de votre tentative. Pour des raisons de sécurité et
                d'équité, vous ne pouvez plus continuer ce test.
              </AlertDescription>
            </Alert>

            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Pourquoi ce message ?</h3>
              <p className="text-red-700 text-sm">
                Notre système a détecté des tentatives de contournement des règles du test, comme des changements
                d'onglet, des sorties de la fenêtre, des tentatives de copier-coller, ou d'autres actions non autorisées
                pendant l'évaluation.
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => window.history.back()}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                Retour aux offres d'emploi
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render timeout screen
  if (testStage === "timeout") {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-2xl font-bold">Temps écoulé</h3>
        <p className="text-muted-foreground">
          Le temps alloué pour ce test est écoulé. Votre candidature n'a pas pu être complétée.
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Retour
        </Button>
      </div>
    )
  }

  if (loading && testStage === "qcm") {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        <p className="text-muted-foreground">Chargement des questions...</p>
      </div>
    )
  }

  if (testStage === "completed") {
    // Si cheatingDetected est vrai, afficher le message de triche
    if (cheatingDetected) {
      return renderCheatingDetectedMessage()
    }

    // Si personalityAnalysis contient un message, cela signifie que le candidat a déjà passé le test
    if (personalityAnalysis) {
      // Extraire le score du message s'il existe
      const scoreMatch = personalityAnalysis.match(/score est de (\d+)/)
      const score = scoreMatch ? scoreMatch[1] : null

      return (
        <div className="w-full max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-blue-50 p-6 flex flex-col items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg
                  className="h-10 w-10 text-blue-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-800">Test déjà complété</h2>
            </div>

            <div className="p-6">
              <p className="text-center text-gray-600 mb-6">
                Vous avez déjà passé ce test.
                {score && (
                  <span className="block mt-2 font-medium text-lg">
                    Votre score est de <span className="text-blue-600 font-bold">{score}</span>.
                  </span>
                )}
              </p>

              {score && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${Math.min(Number.parseInt(score), 100)}%` }}
                  ></div>
                </div>
              )}

              <div className="flex justify-center">
                <Button variant="outline" onClick={() => window.history.back()} className="px-6 py-2">
                  Retour
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Sinon, afficher le message de succès normal
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold">Test terminé avec succès !</h3>
        <p className="text-muted-foreground mb-6">
          Votre candidature a été enregistrée avec succès. N'hésitez pas à consulter votre email, nous vous enverrons
          bientôt une notification concernant votre acceptation ou rejet pour un entretien présentiel.
        </p>

        {/* Rating system with smiles */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
          <h4 className="text-xl font-semibold mb-6 text-center">Comment évaluez-vous ce test ?</h4>
          <div className="flex justify-center gap-8">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => handleRatingSubmit(score)}
                className="transition-all duration-300 hover:scale-110 focus:outline-none"
              >
                <div
                  className={`h-16 w-16 rounded-full flex items-center justify-center shadow-md ${
                    selectedRating === score
                      ? "bg-blue-600 text-white transform scale-110"
                      : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  }`}
                >
                  {score === 1 && <span className="text-3xl">😞</span>}
                  {score === 2 && <span className="text-3xl">🙁</span>}
                  {score === 3 && <span className="text-3xl">😐</span>}
                  {score === 4 && <span className="text-3xl">🙂</span>}
                  {score === 5 && <span className="text-3xl">😄</span>}
                </div>
                <span className="block mt-3 text-sm font-medium text-center">
                  {score === 1 && "Très insatisfait"}
                  {score === 2 && "Insatisfait"}
                  {score === 3 && "Neutre"}
                  {score === 4 && "Satisfait"}
                  {score === 5 && "Très satisfait"}
                </span>
              </button>
            ))}
          </div>
          {ratingSubmitted && (
            <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-md text-center text-green-700 font-medium">
              Merci pour votre évaluation !
            </div>
          )}
        </div>
      </div>
    )
  }

  if (error && testStage === "qcm") {
    return (
      <div className="p-6 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button onClick={fetchQuestions}>Réessayer</Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Retour
          </Button>
        </div>
      </div>
    )
  }

  if (!questions.length && testStage === "qcm") {
    return (
      <div className="p-6 space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Aucune question n'a été trouvée pour ce test.</AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button onClick={fetchQuestions}>Réessayer</Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Retour
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = currentQuestionIndex > 0 ? (currentQuestionIndex / questions.length) * 100 : 0

  return (
    <TestSecurity candidatId={candidatId} offreId={offreId} onViolation={handleSecurityViolation} maxViolations={2}>
      <div className="p-4 space-y-6">
        {/* Timer display */}
        <div className="flex items-center justify-center gap-2 text-lg font-medium">
          <Clock className="h-5 w-5" />
          <span className={`${timeRemaining < 60 ? "text-red-500 animate-pulse" : ""}`}>
            Temps restant: {formatTime(timeRemaining)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">
              Question {currentQuestionIndex + 1} sur {questions.length}
            </h3>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% complété</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Question card */}
        <div className="border rounded-lg p-6 space-y-6 shadow-sm">
          <div className="space-y-2">
            <h4 className="text-lg font-medium">{currentQuestion.question}</h4>
            <p className="text-sm text-muted-foreground">Trait: {currentQuestion.trait}</p>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${
                  selectedOption === option ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                }`}
                onClick={() => handleOptionSelect(option)}
              >
                <div className="flex-shrink-0 mr-3">
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                      selectedOption === option ? "border-primary" : "border-muted-foreground"
                    }`}
                  >
                    {selectedOption === option && <div className="h-3 w-3 rounded-full bg-primary"></div>}
                  </div>
                </div>
                <span className="text-sm">{option.text}</span>
              </div>
            ))}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0 || submitting}
            >
              Question précédente
            </Button>

            <Button onClick={goToNextQuestion} disabled={!selectedOption || submitting}>
              {submitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
                  Traitement...
                </>
              ) : currentQuestionIndex === questions.length - 1 ? (
                "Terminer le test"
              ) : (
                "Question suivante"
              )}
            </Button>
          </div>
        </div>

        {/* Question counter pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm cursor-pointer transition-colors ${
                index === currentQuestionIndex
                  ? "bg-primary text-primary-foreground"
                  : answers[index]
                    ? "bg-primary/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              onClick={() => navigateToQuestion(index)}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>
    </TestSecurity>
  )
}

export default PersonalityTest
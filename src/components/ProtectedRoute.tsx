"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Navigation } from "@/components/navigation"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    // Skip protection for login page
    if (pathname === "/login") {
      setShouldRedirect(false)
      return
    }

    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      setShouldRedirect(true)
      router.replace("/login")
    } else if (!isLoading && isAuthenticated) {
      setShouldRedirect(false)
    }
  }, [isAuthenticated, isLoading, router, pathname])

  // Always render login page without navigation
  if (pathname === "/login") {
    return (
      <div className="min-h-screen bg-background">
        <main>
          {children}
        </main>
      </div>
    )
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold">Authenticating...</h2>
              <p className="text-sm text-gray-600">
                Verifying your credentials and setting up your session.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading during redirect
  if (shouldRedirect || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold">Redirecting...</h2>
              <p className="text-sm text-gray-600">
                Taking you to the login page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render protected content with navigation
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthContext"
import { LogIn, Shield, AlertTriangle } from "lucide-react"

export default function LoginPage() {
  const { login, loginWithBypass, isLoading } = useAuth()
  const router = useRouter()
  const [bypassCredentials, setBypassCredentials] = useState({ username: "", password: "" })
  const [bypassError, setBypassError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAzureLogin = async () => {
    try {
      await login()
      router.push("/")
    } catch (error) {
      console.error("Azure login failed:", error)
    }
  }

  const handleBypassLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setBypassError("")

    try {
      const success = await loginWithBypass(bypassCredentials.username, bypassCredentials.password)
      if (success) {
        router.push("/")
      } else {
        setBypassError("Invalid credentials. Please check your username and password.")
      }
    } catch (error) {
      console.error("Bypass login failed:", error)
      setBypassError("Login failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 whitespace-nowrap">ERP Admin Hub</h1>
          <p className="text-gray-600">Secure access to your ERP administration tools</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Choose your authentication method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="azure" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="azure">EntraID / Azure AD</TabsTrigger>
                <TabsTrigger value="bypass">System Access</TabsTrigger>
              </TabsList>

              <TabsContent value="azure" className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <LogIn className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-800">
                      Sign in with your corporate account
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleAzureLogin}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Signing in..." : "Sign in with Microsoft"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="bypass" className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">System Access</p>
                      <p>For testing and diagnostics only. Use your secure bypass credentials.</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleBypassLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={bypassCredentials.username}
                      onChange={(e) => setBypassCredentials(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Enter system username"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={bypassCredentials.password}
                      onChange={(e) => setBypassCredentials(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter system password"
                      required
                    />
                  </div>

                  {bypassError && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <p className="text-sm text-red-800">{bypassError}</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={isSubmitting || isLoading}
                    className="w-full"
                    variant="secondary"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Authenticating..." : "System Login"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />
            
            <div className="text-center text-xs text-gray-500">
              <p>Secure authentication powered by Microsoft Identity Platform</p>
              <p className="mt-1">© 2024 ERP Admin Hub - All rights reserved</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
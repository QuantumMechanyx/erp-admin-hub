"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { AuthenticationResult, PublicClientApplication } from "@azure/msal-browser"
import { MsalProvider, useMsal } from "@azure/msal-react"
import { msalConfig } from "@/lib/auth-config"
import bcryptjs from "bcryptjs"
import { bypassConfig } from "@/lib/auth-config"

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig)

export interface User {
  id: string
  name: string
  email: string
  authType: "azure" | "bypass"
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => Promise<void>
  loginWithBypass: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Inner provider that uses MSAL context
function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { instance, accounts } = useMsal()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bypassUser, setBypassUser] = useState<User | null>(null)
  const [msalInitialized, setMsalInitialized] = useState(false)

  // Initialize MSAL and check for existing authentication
  useEffect(() => {
    const initializeMsal = async () => {
      try {
        console.log('🚀 Initializing MSAL...')
        await instance.initialize()
        console.log('✅ MSAL initialized')
        setMsalInitialized(true)
      } catch (error) {
        console.error('❌ MSAL initialization failed:', error)
        setMsalInitialized(true) // Continue anyway
      }
    }

    initializeMsal()
  }, [instance])

  // Check for bypass auth in local storage
  useEffect(() => {
    if (!msalInitialized) {
      console.log('⏳ Waiting for MSAL initialization...')
      return
    }
    const checkBypassAuth = () => {
      const bypassAuth = localStorage.getItem("bypass-auth")
      
      if (bypassAuth) {
        try {
          const userData = JSON.parse(bypassAuth)
          setBypassUser(userData)
          setUser(userData)
          setIsLoading(false)
          return
        } catch (error) {
          localStorage.removeItem("bypass-auth")
        }
      }
      
      // If no bypass auth, check MSAL accounts
      if (accounts.length > 0) {
        const account = accounts[0]
        setUser({
          id: account.homeAccountId,
          name: account.name || account.username,
          email: account.username,
          authType: "azure",
        })
        setIsLoading(false)
        return
      }
      
      // Only set loading to false if we've checked both authentication methods
      // and found no valid authentication
      setIsLoading(false)
    }

    checkBypassAuth()
  }, [msalInitialized, accounts])

  const login = async () => {
    try {
      setIsLoading(true)
      const response: AuthenticationResult = await instance.loginPopup({
        scopes: ["openid", "profile", "User.Read"],
      })
      
      if (response.account) {
        setUser({
          id: response.account.homeAccountId,
          name: response.account.name || response.account.username,
          email: response.account.username,
          authType: "azure",
        })
      }
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithBypass = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      // Verify credentials
      if (username === bypassConfig.username && bypassConfig.passwordHash) {
        const isValidPassword = await bcryptjs.compare(password, bypassConfig.passwordHash)
        
        if (isValidPassword) {
          const bypassUserData: User = {
            id: "bypass-admin",
            name: "System Administrator",
            email: "admin@bypass.local",
            authType: "bypass",
          }
          
          // Store in local storage
          localStorage.setItem("bypass-auth", JSON.stringify(bypassUserData))
          setBypassUser(bypassUserData)
          setUser(bypassUserData)
          setIsLoading(false)
          return true
        }
      }
      
      setIsLoading(false)
      return false
    } catch (error) {
      console.error("Bypass login failed:", error)
      setIsLoading(false)
      return false
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      
      // Clear bypass auth
      localStorage.removeItem("bypass-auth")
      setBypassUser(null)
      
      // If Azure user, logout from MSAL
      if (user?.authType === "azure") {
        await instance.logoutPopup()
      }
      
      setUser(null)
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const contextValue: AuthContextType = {
    user: bypassUser || user,
    isLoading,
    isAuthenticated: !!(bypassUser || user),
    login,
    loginWithBypass,
    logout,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Main provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProviderInner>
        {children}
      </AuthProviderInner>
    </MsalProvider>
  )
}
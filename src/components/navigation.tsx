"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { EyeOff, Eye, LogOut, User } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const navigation = [
  {
    name: "Working Interface",
    href: "/dashboard",
    description: "Working interface for issue management"
  },
  {
    name: "Meeting Interface",
    href: "/meetings",
    description: "Meeting interface for discussions"
  },
  {
    name: "Action Item Interface",
    href: "/action-items",
    description: "Action item management and organization"
  },
  {
    name: "Email Interface",
    href: "/emails",
    description: "Email drafting interface"
  }
]

export function Navigation() {
  const pathname = usePathname()
  const [isHidden, setIsHidden] = useState(false)
  const isMeetingPage = pathname === "/meetings"
  const { user, logout, isAuthenticated } = useAuth()

  if (isHidden) {
    return (
      <div className="fixed top-2 right-2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsHidden(false)}
          className="bg-background shadow-lg"
          title="Show navigation"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold whitespace-nowrap">
              ERP Admin Hub
            </Link>
            <nav className="flex space-x-4">
              {navigation.map((item) => (
                <Button
                  key={item.name}
                  variant={pathname.startsWith(item.href) ? "default" : "ghost"}
                  asChild
                >
                  <Link href={item.href}>
                    {item.name}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated && user && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user.name || user.username}</span>
              </div>
            )}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="p-2"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
            {isMeetingPage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsHidden(true)}
                className="p-2"
                title="Hide navigation for presentation"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
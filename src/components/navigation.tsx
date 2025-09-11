"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

const navigation = [
  {
    name: "Home",
    href: "/",
    description: "Main interface selector"
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    description: "Working interface for issue management"
  },
  {
    name: "Meetings",
    href: "/meetings",
    description: "Meeting interface for discussions"
  },
  {
    name: "Email Drafts",
    href: "/emails",
    description: "Email drafting interface"
  }
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold">
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
        </div>
      </div>
    </header>
  )
}
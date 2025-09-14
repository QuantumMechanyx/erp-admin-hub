import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold whitespace-nowrap">ERP Admin Hub</h1>
        <p className="text-xl text-muted-foreground">
          Manage high-priority ERP issues, organize meetings, and draft stakeholder communications
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Working Interface</CardTitle>
            <CardDescription>
              Organize and track high-priority ERP issues with detailed notes and progress tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Working Interface</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Meeting Interface</CardTitle>
            <CardDescription>
              Plan and conduct meetings focused on issue discussions and action items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/meetings">Go to Meeting Interface</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Email Interface</CardTitle>
            <CardDescription>
              Draft weekly team summary emails with selected issues. Now with more AI!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/emails">Go to Email Interface</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Send } from "lucide-react"

export default function NotificationsPage() {
    const { toast } = useToast()

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const data = Object.fromEntries(formData.entries())
        console.log(data)
        toast({
            title: "Notification Sent!",
            description: `Your message has been broadcast to the "${data.segment}" segment.`,
        })
        
        // Reset form
        event.currentTarget.reset()
    }

  return (
    <div className="flex flex-col gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Notification Broadcast</h1>
            <p className="text-muted-foreground">Send push notifications to user segments.</p>
        </div>
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Compose Notification</CardTitle>
                <CardDescription>Craft your message and choose who to send it to.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="segment">Target Segment</Label>
                        <Select name="segment" defaultValue="all">
                            <SelectTrigger>
                                <SelectValue placeholder="Select a user segment" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                <SelectItem value="android">Android Users</SelectItem>
                                <SelectItem value="ios">iOS Users</SelectItem>
                                <SelectItem value="lagos-users">Users in Lagos</SelectItem>
                                <SelectItem value="abuja-users">Users in Abuja</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="title">Notification Title</Label>
                        <Input id="title" name="title" placeholder="e.g., Price Drop Alert!" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea id="message" name="message" placeholder="Enter your notification message here..." required />
                    </div>
                    <Button type="submit" className="w-full sm:w-auto">
                        <Send className="mr-2 h-4 w-4"/>
                        Send Notification
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  )
}

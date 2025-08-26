"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { format, formatDistanceToNow } from "date-fns"
import { Loader2, ArrowLeft, Mail, Phone, User as UserIcon, Edit, ShieldX } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string;
}

interface PriceReport {
    id: number;
    created_at: string;
    price: number | null;
    station_name: string;
}

export default function UserDetailPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.id as string

    const [user, setUser] = React.useState<UserProfile | null>(null)
    const [reports, setReports] = React.useState<PriceReport[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (!userId) return;

        const fetchUserData = async () => {
            setLoading(true)
            setError(null)

            // Fetch user profile
            const profilePromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
            
            // Fetch user's price reports
            const reportsPromise = supabase
                .from('price_reports')
                .select(`
                    id, created_at, price,
                    stations ( name )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10)

            const [{ data: profileData, error: profileError }, { data: reportsData, error: reportsError }] = await Promise.all([profilePromise, reportsPromise]);

            if (profileError || !profileData) {
                console.error("Error fetching profile:", profileError?.message)
                setError("Could not find the requested user.")
                setUser(null)
            } else {
                const authUser = await supabase.auth.admin.getUserById(userId)
                const provider = authUser.data.user?.app_metadata.provider || 'unknown';
                setUser({ ...profileData, provider });
            }

            if (reportsError) {
                console.error("Error fetching reports:", reportsError?.message)
                // Non-fatal, so we don't set a main error
            } else {
                const formattedReports = reportsData.map((r: any) => ({
                    id: r.id,
                    created_at: r.created_at,
                    price: r.price,
                    station_name: r.stations?.name || 'Unknown Station'
                }))
                setReports(formattedReports)
            }

            setLoading(false)
        }

        fetchUserData()
    }, [userId])

    if (loading) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading User Profile...</p>
            </div>
        )
    }

    if (error || !user) {
        return (
            <div className="text-center py-10">
                <p className="text-lg font-semibold text-destructive">{error || "User not found."}</p>
                 <Button variant="outline" onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight font-headline">User Profile</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader className="items-center text-center">
                             <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage src={user.avatar_url || ''} />
                                <AvatarFallback className="text-3xl">
                                    <UserIcon />
                                </AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-2xl">{user.full_name || "Anonymous User"}</CardTitle>
                            <CardDescription>{user.email || user.phone}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <div className="flex justify-center gap-2 mb-4">
                                <Button variant="outline" size="sm" disabled><Edit className="mr-2"/> Edit Profile</Button>
                                <Button variant="destructive" size="sm" disabled><ShieldX className="mr-2"/> Suspend</Button>
                            </div>
                            <div className="space-y-2 text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    {user.provider === 'email' ? <Mail className="h-4 w-4"/> : <Phone className="h-4 w-4"/>}
                                    <span>Signed up with <span className="font-semibold capitalize text-foreground">{user.provider}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4"/>
                                    <span>Joined {format(new Date(user.created_at), "MMMM d, yyyy")}</span>
                                </div>
                                {user.last_sign_in_at && (
                                     <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4"/>
                                        <span>Last seen {formatDistanceToNow(new Date(user.last_sign_in_at))} ago</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                         <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>A log of the latest price submissions from this user.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Station</TableHead>
                                        <TableHead>Submitted Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {reports.length > 0 ? reports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">{report.station_name}</TableCell>
                                        <TableCell>{report.price ? `₦${report.price.toFixed(2)}` : 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">Logged</Badge>
                                        </TableCell>
                                        <TableCell>{format(new Date(report.created_at), "d MMM, h:mm a")}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">This user has not submitted any price reports yet.</TableCell>
                                    </TableRow>
                                )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

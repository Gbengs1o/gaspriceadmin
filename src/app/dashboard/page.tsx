"use client"

import { useState, useEffect } from "react"
import { Activity, ArrowUpRight, Fuel, Users, FileText, CheckCheck } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabase"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface Submission {
  station: string
  price: number
  status: 'Approved' | 'Pending' | 'Flagged'
  date: string
  stations?: { name: string, location: string } | null
  created_at: string
}

const chartData = [
  { month: "Jan", price: 186 },
  { month: "Feb", price: 205 },
  { month: "Mar", price: 237 },
  { month: "Apr", price: 210 },
  { month: "May", price: 250 },
  { month: "Jun", price: 275 },
]

const regionData = [
    { region: "Lagos", submissions: 45 },
    { region: "Abuja", submissions: 32 },
    { region: "Kano", submissions: 28 },
    { region: "Rivers", submissions: 38 },
    { region: "Oyo", submissions: 22 },
]

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStations: 0, activeUsers: 0, pendingSubmissions: 0, reportsGenerated: 89 });
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // These queries assume you have tables named 'stations', 'profiles', and 'submissions'
        // and that 'submissions' has a foreign key to 'stations'.
        const stationPromise = supabase.from('stations').select('*', { count: 'exact', head: true });
        const userPromise = supabase.from('profiles').select('*', { count: 'exact', head: true });
        const pendingPromise = supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
        
        const submissionsPromise = supabase
          .from('submissions')
          .select(`
            price,
            status,
            created_at,
            stations ( name, location ) 
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        const [
            { count: stationCount }, 
            { count: userCount }, 
            { count: pendingCount },
            { data: submissionsData, error: submissionsError }
        ] = await Promise.all([stationPromise, userPromise, pendingPromise, submissionsPromise]);
      
        setStats(prev => ({
          ...prev,
          totalStations: stationCount ?? 0,
          activeUsers: userCount ?? 0,
          pendingSubmissions: pendingCount ?? 0,
        }));

        if (submissionsData) {
          const formattedSubmissions = submissionsData.map((s: any) => ({
              station: s.stations ? `${s.stations.name}, ${s.stations.location}` : 'Unknown Station',
              price: s.price,
              status: s.status,
              date: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              created_at: s.created_at,
          }));
          setRecentSubmissions(formattedSubmissions);
        }
        if (submissionsError) console.error("Error fetching submissions:", submissionsError);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{stats.totalStations.toLocaleString()}</div>}
            <p className="text-xs text-muted-foreground">+20 since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>}
            <p className="text-xs text-muted-foreground">+180.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <CheckCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.pendingSubmissions.toLocaleString()}</div>}
            <p className="text-xs text-muted-foreground">+32 since last hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats.reportsGenerated}</div>}
            <p className="text-xs text-muted-foreground">+12 this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Average Price Trend (PMS)</CardTitle>
            <CardDescription>Average price over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₦${value}`}/>
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderColor: 'hsl(var(--border))' 
                    }}
                />
                <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Price Submissions by Region</CardTitle>
            <CardDescription>Most active regions for price submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={regionData}>
                    <XAxis dataKey="region" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            borderColor: 'hsl(var(--border))' 
                        }}
                    />
                    <Bar dataKey="submissions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Recent Price Submissions</CardTitle>
            <CardDescription>A log of the most recent price updates from users.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead>Price (PMS)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    Array.from({length: 5}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                    recentSubmissions.map((submission, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{submission.station}</TableCell>
                        <TableCell>₦{submission.price.toFixed(2)}</TableCell>
                        <TableCell>
                        <Badge variant={submission.status === 'Flagged' ? 'destructive' : submission.status === 'Pending' ? 'secondary' : 'default'}>
                            {submission.status}
                        </Badge>
                        </TableCell>
                        <TableCell>{submission.date}</TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  )
}

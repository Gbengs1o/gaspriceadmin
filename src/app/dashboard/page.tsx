"use client"

import { useState, useEffect } from "react"
import { Fuel, Users, FileText, CheckCheck } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns" // A great library for formatting dates

// 1. Make sure you have a Supabase client file at this path
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

// --- Mock Data for the Region Chart (until you add a 'state' column) ---
const regionData = [
    { region: "Lagos", submissions: 45 },
    { region: "Abuja", submissions: 32 },
    { region: "Kano", submissions: 28 },
    { region: "Rivers", submissions: 38 },
    { region: "Oyo", submissions: 22 },
]

// --- Define Types for our Fetched Data ---
interface Stats {
  totalStations: number;
  activeUsers: number;
  totalSubmissions: number;
}
interface RecentSubmission {
  stationName: string;
  price: number;
  date: string;
}
interface MonthlyPrice {
  month: string;
  price: number;
}


export default function DashboardPage() {
  // 2. State variables to hold real data and loading status
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [priceTrendData, setPriceTrendData] = useState<MonthlyPrice[]>([]);

  // 3. useEffect to fetch all dashboard data on component load
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      // --- Fetching Data for the Stat Cards ---
      const stationCountPromise = supabase.from('stations').select('*', { count: 'exact', head: true });
      const userCountPromise = supabase.from('profiles').select('*', { count: 'exact', head: true });
      const submissionCountPromise = supabase.from('price_reports').select('*', { count: 'exact', head: true });

      // --- Fetching Data for the Recent Submissions Table ---
      const recentSubmissionsPromise = supabase
        .from('price_reports')
        .select(`
          price,
          created_at,
          stations ( name, address ) 
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // --- Fetching Data for the Price Trend Chart via RPC ---
      const priceTrendPromise = supabase.rpc('get_monthly_avg_price');

      // --- Run all queries in parallel for speed ---
      const [
        { count: stationCount },
        { count: userCount },
        { count: submissionCount },
        { data: submissionsData, error: submissionsError },
        { data: trendData, error: trendError }
      ] = await Promise.all([
        stationCountPromise,
        userCountPromise,
        submissionCountPromise,
        recentSubmissionsPromise,
        priceTrendPromise
      ]);

      // --- Process and set state for all fetched data ---
      setStats({
        totalStations: stationCount ?? 0,
        activeUsers: userCount ?? 0,
        totalSubmissions: submissionCount ?? 0,
      });

      if (submissionsData) {
        const formattedSubmissions = submissionsData.map((s: any) => ({
            stationName: s.stations ? `${s.stations.name}, ${s.stations.address || ''}`.replace(/, $/, '') : 'Unknown Station',
            price: s.price,
            date: format(new Date(s.created_at), "MMM d, h:mm a"),
        }));
        setRecentSubmissions(formattedSubmissions);
      }
      if (submissionsError) console.error("Error fetching submissions:", submissionsError.message);

      if (trendData) {
        const formattedTrendData = trendData.map((d: any) => ({
            month: format(new Date(d.month_start), 'MMM'),
            price: parseFloat(d.average_price).toFixed(2),
        }));
        setPriceTrendData(formattedTrendData);
      }
      if (trendError) console.error("Error fetching price trend:", trendError.message);
      
      setIsLoading(false);
    };

    fetchDashboardData();
  }, []); // Empty dependency array means this runs once on mount


  // 4. Render a loading state while fetching data
  if (isLoading || !stats) {
    return <div className="p-4">Loading Dashboard...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* --- Stat Cards Using Real Data --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Live count from database</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total registered profiles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <CheckCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All price reports received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* This remains static until business logic for "reports" is defined */}
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+12 this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* --- Price Trend Chart Using Real Data --- */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Average Price Trend (PMS)</CardTitle>
            <CardDescription>Average price over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={priceTrendData}>
                <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₦${value}`}/>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}/>
                <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* --- Region Chart (Action Required) --- */}
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Price Submissions by Region</CardTitle>
            <CardDescription>
              Action Required: Add a 'state' column to your 'stations' table to enable this chart.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={regionData}>
                    <XAxis dataKey="region" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                    <Bar dataKey="submissions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* --- Recent Submissions Table Using Real Data --- */}
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
                {recentSubmissions.map((submission, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{submission.stationName}</TableCell>
                    <TableCell>₦{submission.price.toFixed(2)}</TableCell>
                    <TableCell>
                      {/* Since there is no status column, we show a default badge */}
                      <Badge variant={'outline'}>Logged</Badge>
                    </TableCell>
                    <TableCell>{submission.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  )
}
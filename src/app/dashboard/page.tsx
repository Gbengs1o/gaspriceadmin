"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Fuel, Users, FileText, CheckCheck } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { format } from "date-fns" 

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
import { Loader2 } from "lucide-react"


// --- Define Types for our Fetched Data ---
interface Stats {
  totalStations: number;
  activeUsers: number;
  totalSubmissions: number;
}
interface RecentSubmission {
  stationName: string;
  price: number | null;
  date: string;
}
interface MonthlyPrice {
  month: string;
  price: number;
}
interface RegionSubmission {
    state: string;
    submissions: number;
}


export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [priceTrendData, setPriceTrendData] = useState<MonthlyPrice[]>([]);
  const [regionData, setRegionData] = useState<RegionSubmission[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      const stationCountPromise = supabase.from('stations').select('*', { count: 'exact', head: true });
      const userCountPromise = supabase.from('profiles').select('*', { count: 'exact', head: true });
      const submissionCountPromise = supabase.from('price_reports').select('*', { count: 'exact', head: true });

      const recentSubmissionsPromise = supabase
        .from('price_reports')
        .select(`
          price,
          created_at,
          stations ( name, address ) 
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const priceTrendPromise = supabase.rpc('get_monthly_avg_price');
      
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const regionSubmissionsPromise = supabase
        .from('price_reports')
        .select('stations ( state )')
        .gte('created_at', sevenDaysAgo);


      const [
        { count: stationCount },
        { count: userCount },
        { count: submissionCount },
        { data: submissionsData, error: submissionsError },
        { data: trendData, error: trendError },
        { data: regionChartData, error: regionChartError }
      ] = await Promise.all([
        stationCountPromise,
        userCountPromise,
        submissionCountPromise,
        recentSubmissionsPromise,
        priceTrendPromise,
        regionSubmissionsPromise
      ]);

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

      if (regionChartData) {
        const counts = regionChartData
          .filter(r => r.stations?.state)
          .reduce((acc: Record<string, number>, report: any) => {
            const state = report.stations.state;
            acc[state] = (acc[state] || 0) + 1;
            return acc;
        }, {});

        const sortedData = Object.entries(counts)
            .map(([state, submissions]) => ({ state, submissions }))
            .sort((a, b) => b.submissions - a.submissions)
            .slice(0, 10); // Get top 10

        setRegionData(sortedData);
      }
      if (regionChartError) {
        console.error("Error fetching region data:", regionChartError.message);
        setRegionData([]);
      }
      
      setIsLoading(false);
    };

    fetchDashboardData();
  }, []); 


  if (isLoading || !stats) {
    return (
        <div className="flex h-full w-full items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* --- Stat Cards Using Real Data --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/stations">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStations.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Live count from database</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/users">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total registered profiles</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/moderation">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <CheckCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubmissions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All price reports received</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/reports">
          <Card className="hover:bg-muted/50 transition-colors">
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
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
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
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Weekly Submissions by State</CardTitle>
            <CardDescription>
              {regionData.length > 0 ? "Top states by user price submissions in the last 7 days." : "No submission data for the last 7 days."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
                {regionData.length > 0 ? (
                    <BarChart data={regionData} layout="vertical">
                        <XAxis type="number" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} hide />
                        <YAxis type="category" dataKey="state" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} cursor={{ fill: 'hsl(var(--accent))' }}/>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                        <Bar dataKey="submissions" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        No recent submission data to display.
                    </div>
                )}
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
                {recentSubmissions.map((submission, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{submission.stationName}</TableCell>
                    <TableCell>{submission.price ? `₦${submission.price.toFixed(2)}` : 'N/A'}</TableCell>
                    <TableCell>
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

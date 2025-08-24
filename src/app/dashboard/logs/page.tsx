import { Badge } from "@/components/ui/badge"
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

const logs = [
  { timestamp: "2024-07-29 14:30:15", user: "admin@example.com", action: "LOGIN", details: "User logged in successfully from IP 192.168.1.1" },
  { timestamp: "2024-07-29 14:32:01", user: "chidi@example.com", action: "APPROVE_PRICE", details: "Approved price submission #5821 for Mobil, VI" },
  { timestamp: "2024-07-29 14:35:22", user: "admin@example.com", action: "EDIT_STATION", details: "Updated metadata for station ID #102 (NNPC, Maitama)" },
  { timestamp: "2024-07-29 14:40:11", user: "fatima@example.com", action: "REJECT_PRICE", details: "Rejected price submission #5824 (Price too low)" },
  { timestamp: "2024-07-29 14:50:48", user: "admin@example.com", action: "SUSPEND_USER", details: "Suspended user musa@example.com for policy violation" },
  { timestamp: "2024-07-29 15:00:00", user: "system", action: "GENERATE_REPORT", details: "Generated weekly pricing report for Lagos region" },
];

const getBadgeVariant = (action: string) => {
    if (action.includes("LOGIN") || action.includes("APPROVE")) return "default";
    if (action.includes("EDIT") || action.includes("GENERATE")) return "secondary";
    if (action.includes("REJECT") || action.includes("SUSPEND")) return "destructive";
    return "outline";
}

export default function LogsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">System Logs</h1>
        <p className="text-muted-foreground">Track moderator actions, logins, and system events.</p>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>A detailed log of all actions performed in the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, index) => (
                <TableRow key={index}>
                  <TableCell className="text-sm text-muted-foreground">{log.timestamp}</TableCell>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(log.action)}>{log.action}</Badge>
                  </TableCell>
                  <TableCell>{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

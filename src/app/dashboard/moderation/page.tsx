import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { PriceModerationTool } from "@/components/price-moderation-tool"

const submissions = [
  { id: 1, station: "Oando, Lekki", product: "PMS", price: 725.00, avgPrice: 720.00, status: "Pending" },
  { id: 2, station: "NNPC, Maitama", product: "PMS", price: 950.00, avgPrice: 715.00, status: "Flagged" },
  { id: 3, station: "AP, Bodija", product: "Diesel", price: 1200.00, avgPrice: 1210.00, status: "Approved" },
  { id: 4, station: "Mobil, VI", product: "PMS", price: 715.00, avgPrice: 720.00, status: "Approved" },
  { id: 5, station: "Conoil, Wuse 2", product: "Kerosene", price: 1350.00, avgPrice: 1340.00, status: "Pending" },
  { id: 6, station: "TotalEnergies, Ikeja", product: "PMS", price: 720.50, avgPrice: 718.00, status: "Approved" },
];

export default function ModerationPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 lg:grid-cols-3 lg:gap-8">
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2">
         <Card>
            <CardHeader>
                <CardTitle>Price Submissions</CardTitle>
                <CardDescription>Review and moderate user-submitted fuel prices.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Station</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Submitted Price</TableHead>
                        <TableHead>Average Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {submissions.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.station}</TableCell>
                            <TableCell>{item.product}</TableCell>
                            <TableCell>₦{item.price.toFixed(2)}</TableCell>
                            <TableCell>₦{item.avgPrice.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant={item.status === 'Flagged' ? 'destructive' : item.status === 'Pending' ? 'secondary' : 'default'}>
                                    {item.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {item.status === 'Pending' && (
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">Approve</Button>
                                        <Button variant="destructive" size="sm">Reject</Button>
                                    </div>
                                )}
                                 {item.status === 'Flagged' && (
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">Review</Button>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
      <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
        <PriceModerationTool />
      </div>
    </div>
  )
}

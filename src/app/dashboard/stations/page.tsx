"use client"

import { PlusCircle, MoreHorizontal, File } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const stations = [
  { name: "TotalEnergies, Ikeja", state: "Lagos", status: "Active", submissions: 1205 },
  { name: "Mobil, Victoria Island", state: "Lagos", status: "Active", submissions: 980 },
  { name: "NNPC, Maitama", state: "Abuja", status: "Inactive", submissions: 250 },
  { name: "Oando, Lekki Phase 1", state: "Lagos", status: "Active", submissions: 1530 },
  { name: "AP, Bodija", state: "Oyo", status: "Active", submissions: 450 },
  { name: "Conoil, Wuse 2", state: "Abuja", status: "Active", submissions: 890 },
];

export default function StationsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Station Management</h1>
            <p className="text-muted-foreground">Manage all fuel stations in the system.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline">
                <File className="mr-2 h-4 w-4" />
                Export
            </Button>
             <Dialog>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Station
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Add New Station</DialogTitle>
                    <DialogDescription>
                        Fill in the details for the new fuel station.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" placeholder="e.g., TotalEnergies, Ikeja" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">Address</Label>
                            <Input id="address" placeholder="123 Allen Avenue" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="state" className="text-right">State</Label>
                             <Select>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a state" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lagos">Lagos</SelectItem>
                                    <SelectItem value="abuja">Abuja</SelectItem>
                                    <SelectItem value="rivers">Rivers</SelectItem>
                                    <SelectItem value="oyo">Oyo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="metadata" className="text-right">Metadata</Label>
                            <Textarea id="metadata" placeholder="e.g., Has 24/7 service, ATM available" className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                    <Button type="submit">Save Station</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>
       <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations.map((station) => (
                <TableRow key={station.name}>
                  <TableCell className="font-medium">{station.name}</TableCell>
                  <TableCell>{station.state}</TableCell>
                  <TableCell>
                    <Badge variant={station.status === "Active" ? "default" : "secondary"}>
                      {station.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{station.submissions}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-6</strong> of <strong>{stations.length}</strong> stations
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

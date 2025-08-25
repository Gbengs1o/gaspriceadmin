"use client"

import { useState, useEffect, useCallback } from "react"
import { PlusCircle, MoreHorizontal, File, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase" // Make sure this path is correct

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NIGERIAN_STATES } from "@/lib/states" // We will create this file in the next step
import { useToast } from "@/hooks/use-toast"

// Define the shape of our station data
interface Station {
  id: number;
  name: string;
  address: string | null;
  state: string | null;
  is_active: boolean;
  submissionCount: number;
}

const STATIONS_PER_PAGE = 10;

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStations, setTotalStations] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  // State for the "Add Station" Dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStationName, setNewStationName] = useState("");
  const [newStationAddress, setNewStationAddress] = useState("");
  const [newStationState, setNewStationState] = useState("");

  // State for the "Delete" confirmation dialog
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);

  // Memoized fetch function to avoid re-creation
  const fetchStations = useCallback(async () => {
    setIsLoading(true);

    const from = (currentPage - 1) * STATIONS_PER_PAGE;
    const to = from + STATIONS_PER_PAGE - 1;

    // Fetch a paginated list of stations and their total count
    const { data, error, count } = await supabase
      .from("stations")
      .select("id, name, address, state, is_active", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching stations:", error.message || error);
      setStations([]);
      toast({
        variant: "destructive",
        title: "Error Fetching Stations",
        description: error.message || "An unknown error occurred.",
      });
    } else if (data) {
       // For each station, fetch its submission count
      const stationsWithCounts = await Promise.all(
        data.map(async (station) => {
          const { count: submissionCount } = await supabase
            .from("price_reports")
            .select('*', { count: 'exact', head: true })
            .eq("station_id", station.id);
          return { ...station, submissionCount: submissionCount ?? 0 };
        })
      );
      setStations(stationsWithCounts);
      setTotalStations(count ?? 0);
    }
    setIsLoading(false);
  }, [currentPage, toast]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);


  const handleAddStation = async () => {
    if (!newStationName || !newStationState) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill in the station name and state.",
        });
        return;
    }
    const { error } = await supabase.from('stations').insert({
        name: newStationName,
        address: newStationAddress,
        state: newStationState,
        // You can add more fields here like latitude, longitude if needed
    });

    if (error) {
        toast({
            variant: "destructive",
            title: "Error Adding Station",
            description: error.message,
        });
    } else {
        toast({
            title: "Station Added",
            description: "The new station has been added successfully.",
        });
        // Reset form and close dialog
        setNewStationName("");
        setNewStationAddress("");
        setNewStationState("");
        setIsAddDialogOpen(false);
        // Refresh the table
        fetchStations();
    }
  }

  const handleDeleteStation = async () => {
    if (!stationToDelete) return;

    const { error } = await supabase
        .from('stations')
        .delete()
        .eq('id', stationToDelete.id);

    if (error) {
        toast({
            variant: "destructive",
            title: "Error Deleting Station",
            description: error.message,
        });
    } else {
        toast({
            title: "Station Deleted",
            description: `Station "${stationToDelete.name}" deleted successfully.`,
        });
        setStationToDelete(null); // Close the confirmation dialog
        fetchStations(); // Refresh the table
    }
  }

  const totalPages = Math.ceil(totalStations / STATIONS_PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Station Management</h1>
            <p className="text-muted-foreground">Manage all fuel stations in the system.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" disabled> {/* Export can be implemented later */}
                <File className="mr-2 h-4 w-4" />
                Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                        Fill in the details for the new fuel station. Click save when you're done.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={newStationName} onChange={(e) => setNewStationName(e.target.value)} placeholder="e.g., TotalEnergies, Ikeja" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">Address</Label>
                            <Input id="address" value={newStationAddress} onChange={(e) => setNewStationAddress(e.target.value)} placeholder="123 Allen Avenue" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="state" className="text-right">State</Label>
                             <Select onValueChange={setNewStationState} value={newStationState}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a state" />
                                </SelectTrigger>
                                <SelectContent>
                                    {NIGERIAN_STATES.map(state => (
                                        <SelectItem key={state} value={state}>{state}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button type="submit" onClick={handleAddStation}>Save Station</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>
       <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name & Address</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                </TableRow>
              ) : stations.length > 0 ? (
                stations.map((station) => (
                <TableRow key={station.id}>
                  <TableCell className="font-medium">
                    <div className="font-semibold">{station.name}</div>
                    <div className="text-xs text-muted-foreground">{station.address}</div>
                  </TableCell>
                  <TableCell>{station.state || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={station.is_active ? "default" : "secondary"}>
                      {station.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{station.submissionCount.toLocaleString()}</TableCell>
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
                        <DropdownMenuItem disabled>Edit</DropdownMenuItem> {/* Edit can be implemented next */}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setStationToDelete(station)}>
                            Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center h-24">No stations found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between py-4">
          <div className="text-xs text-muted-foreground">
            Showing <strong>{(currentPage - 1) * STATIONS_PER_PAGE + 1} - {Math.min(currentPage * STATIONS_PER_PAGE, totalStations)}</strong> of <strong>{totalStations}</strong> stations
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Previous</Button>
            <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>Next</Button>
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!stationToDelete} onOpenChange={() => setStationToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the station "{stationToDelete?.name}" and its associated data.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteStation}>
                Yes, delete station
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

    
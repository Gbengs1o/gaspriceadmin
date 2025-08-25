"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { PlusCircle, MoreHorizontal, File, Loader2, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
// A common hook for search inputs, we'll need to create this file.
import { useDebounce } from "@/hooks/use-debounce" 

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NIGERIAN_STATES } from "@/lib/states"

// Define the shape of our station data
interface Station {
  id: number;
  name: string;
  address: string | null;
  state: string | null;
  is_active: boolean;
  submission_count: number;
  total_stations: number; // This will be returned from our RPC
}

const STATIONS_PER_PAGE = 10;

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStations, setTotalStations] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [stationToEdit, setStationToEdit] = useState<Partial<Station> | null>(null);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);

  const fetchStations = useCallback(async () => {
    setIsLoading(true);
    const offset = (currentPage - 1) * STATIONS_PER_PAGE;

    const { data, error } = await supabase.rpc('get_paginated_stations_with_counts', {
      _search_term: debouncedSearchTerm,
      _limit: STATIONS_PER_PAGE,
      _offset: offset,
    });

    if (error) {
      console.error("Error fetching stations:", error.message);
      toast({ variant: "destructive", title: "Error", description: error.message });
      setStations([]);
      setTotalStations(0);
    } else if (data && data.length > 0) {
      setStations(data);
      // The total count is the same for every row, so we can take it from the first one.
      setTotalStations(data[0].total_stations);
    } else {
      setStations([]);
      setTotalStations(0);
    }
    setIsLoading(false);
  }, [currentPage, debouncedSearchTerm, toast]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);


  const handleSaveStation = async () => {
    const stationData = {
        name: stationToEdit?.name,
        address: stationToEdit?.address,
        state: stationToEdit?.state,
        is_active: stationToEdit?.is_active
    };
    
    if (!stationData.name || !stationData.state) {
        toast({ variant: "destructive", title: "Missing Information", description: "Name and state are required." });
        return;
    }

    const { error } = stationToEdit?.id
      ? await supabase.from('stations').update(stationData).eq('id', stationToEdit.id) // UPDATE
      : await supabase.from('stations').insert(stationData); // INSERT

    if (error) {
        toast({ variant: "destructive", title: "Error Saving Station", description: error.message });
    } else {
        toast({ title: "Success", description: `Station has been ${stationToEdit?.id ? 'updated' : 'added'}.` });
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setStationToEdit(null);
        fetchStations(); // Refresh the table
    }
  };

  const handleDeleteStation = async () => {
    if (!stationToDelete) return;

    const { error } = await supabase
      .from('stations')
      .delete()
      .eq('id', stationToDelete.id);

    if (error) {
      toast({ variant: "destructive", title: "Error Deleting Station", description: error.message });
    } else {
      toast({ title: "Station Deleted", description: `${stationToDelete.name} has been removed.` });
      fetchStations(); // Refresh data
    }
    setStationToDelete(null); // Close the dialog
  };
  
  const handleToggleStatus = async (station: Station) => {
    const { error } = await supabase
      .from('stations')
      .update({ is_active: !station.is_active })
      .eq('id', station.id);
    
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not update station status." });
    } else {
      toast({ title: "Status Updated", description: `${station.name} is now ${!station.is_active ? 'Active' : 'Inactive'}.` });
      fetchStations();
    }
  };
  
  const totalPages = Math.ceil(totalStations / STATIONS_PER_PAGE);

  const openEditDialog = (station: Station) => {
    setStationToEdit(station);
    setIsEditDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Station Management</h1>
            <p className="text-muted-foreground">Add, edit, and manage fuel stations.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="search"
                        placeholder="Search by name, address, or state..."
                        className="w-full pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => { setStationToEdit({ is_active: true }); setIsAddDialogOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Station
                </Button>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Station Name</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                </TableRow>
              ) : stations.length > 0 ? (
                stations.map((station) => (
                <TableRow key={station.id}>
                  <TableCell>
                    <div className="font-medium">{station.name}</div>
                    <div className="text-sm text-muted-foreground">{station.address}</div>
                  </TableCell>
                  <TableCell>{station.state}</TableCell>
                  <TableCell>
                    <Badge variant={station.is_active ? "default" : "secondary"}>
                      {station.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{station.submission_count.toLocaleString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEditDialog(station)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(station)}>
                          {station.is_active ? 'Set as Inactive' : 'Set as Active'}
                        </DropdownMenuItem>
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
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No stations found. Try adjusting your search.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
            <div>Showing <strong>{Math.min((currentPage - 1) * STATIONS_PER_PAGE + 1, totalStations)} - {Math.min(currentPage * STATIONS_PER_PAGE, totalStations)}</strong> of <strong>{totalStations}</strong> stations</div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                <span>Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setStationToEdit(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{stationToEdit?.id ? 'Edit Station' : 'Add New Station'}</DialogTitle>
            <DialogDescription>
              {stationToEdit?.id ? 'Make changes to the station here.' : 'Fill in the details for the new station.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={stationToEdit?.name || ""} onChange={(e) => setStationToEdit(s => ({...s, name: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">Address</Label>
                <Input id="address" value={stationToEdit?.address || ""} onChange={(e) => setStationToEdit(s => ({...s, address: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="state" className="text-right">State</Label>
                <Select value={stationToEdit?.state || ""} onValueChange={(value) => setStationToEdit(s => ({...s, state: value}))}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a state" /></SelectTrigger>
                    <SelectContent>{NIGERIAN_STATES.map(state => (<SelectItem key={state} value={state}>{state}</SelectItem>))}</SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); setStationToEdit(null); }}>Cancel</Button>
            <Button type="submit" onClick={handleSaveStation}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!stationToDelete} onOpenChange={() => setStationToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                station and all of its associated data.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStation} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

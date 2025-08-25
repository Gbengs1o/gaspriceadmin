"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { PlusCircle, MoreHorizontal, File, Loader2, Search, MapIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce" 

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface Station {
  id: number;
  name: string;
  address: string | null;
  brand: string | null;
  is_active: boolean;
  submission_count: number;
}

const STATIONS_PER_PAGE = 10;

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStations, setTotalStations] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [stationToEdit, setStationToEdit] = useState<Partial<Station> | null>(null);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);

  const fetchStations = useCallback(async () => {
    setIsLoading(true);
    const offset = (currentPage - 1) * STATIONS_PER_PAGE;

    // --- THIS IS THE FIX: Calling the new, correct RPC function ---
    const { data, error } = await supabase.rpc('get_stations_for_admin_page', {
      _search_term: debouncedSearchTerm,
      _limit: STATIONS_PER_PAGE,
      _offset: offset,
    });

    if (error) {
      console.error("Error fetching stations:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
      setStations([]);
    } else {
        setStations(data || []);
        setTotalStations(data && data.length > 0 ? data[0].total_count : 0);
    }
    setIsLoading(false);
  }, [currentPage, debouncedSearchTerm, toast]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleSaveStation = async () => {
    if (!stationToEdit?.name) {
      toast({ variant: "destructive", title: "Missing Name", description: "Station name is required." });
      return;
    }

    const updates = {
      name: stationToEdit.name,
      address: stationToEdit.address,
      brand: stationToEdit.brand,
      is_active: stationToEdit.is_active,
    };
    
    const { error } = stationToEdit.id
      ? await supabase.from('stations').update(updates).eq('id', stationToEdit.id)
      : await supabase.from('stations').insert(updates);
    
    if (error) {
      toast({ variant: "destructive", title: "Save Failed", description: error.message });
    } else {
      toast({ title: "Success", description: `Station ${stationToEdit.id ? 'updated' : 'added'}.` });
      setIsFormOpen(false);
      fetchStations();
    }
  };

  const handleDeleteStation = async () => {
    if (!stationToDelete) return;
    const { error } = await supabase.from('stations').delete().eq('id', stationToDelete.id);
    if (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: error.message });
    } else {
      toast({ title: "Success", description: `Station "${stationToDelete.name}" deleted.` });
      setStationToDelete(null);
      fetchStations();
    }
  };

  const handleToggleStatus = async (station: Station) => {
    const { error } = await supabase.from('stations').update({ is_active: !station.is_active }).eq('id', station.id);
    if (error) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } else {
      toast({ title: "Success", description: `${station.name} is now ${!station.is_active ? 'Active' : 'Inactive'}.` });
      fetchStations();
    }
  };

  const openFormDialog = (station?: Station) => {
    setStationToEdit(station || { name: '', address: '', brand: '', is_active: true });
    setIsFormOpen(true);
  };
  
  const totalPages = Math.ceil(totalStations / STATIONS_PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Station Management</h1>
          <p className="text-muted-foreground">Search and manage all stations in the system.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/stations/map">
            <Button variant="outline"><MapIcon className="mr-2 h-4 w-4" /> View Map</Button>
          </Link>
          <Button variant="outline" disabled><File className="mr-2 h-4 w-4" /> Export</Button>
          <Button onClick={() => openFormDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Add Station</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or address..." 
              className="pl-10" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Station</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-48 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
              ) : stations.length > 0 ? (
                stations.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">
                      <div className="font-semibold">{station.name}</div>
                      <div className="text-xs text-muted-foreground">{station.address || 'No address'}</div>
                    </TableCell>
                    <TableCell>{station.brand || "N/A"}</TableCell>
                    <TableCell>
                        <Badge variant={station.is_active ? "default" : "secondary"}>{station.is_active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell>{station.submission_count?.toLocaleString() ?? 0}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openFormDialog(station)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(station)}>{station.is_active ? "Set as Inactive" : "Set as Active"}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setStationToDelete(station)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">No stations found for your search.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            {totalStations > 0 ? `Showing ${Math.min((currentPage - 1) * STATIONS_PER_PAGE + 1, totalStations)}-${Math.min(currentPage * STATIONS_PER_PAGE, totalStations)} of ${totalStations} stations` : "0 stations found"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>Next</Button>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{stationToEdit?.id ? "Edit Station" : "Add New Station"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={stationToEdit?.name || ''} onChange={(e) => setStationToEdit(s => ({...s, name: e.target.value}))} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">Address</Label>
                <Input id="address" value={stationToEdit?.address || ''} onChange={(e) => setStationToEdit(s => ({...s, address: e.target.value}))} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="brand" className="text-right">Brand</Label>
                <Input id="brand" value={stationToEdit?.brand || ''} onChange={(e) => setStationToEdit(s => ({...s, brand: e.target.value}))} className="col-span-3" />
              </div>
              <div className="flex items-center space-x-2 justify-end">
                <Switch id="is_active" checked={stationToEdit?.is_active} onCheckedChange={(checked) => setStationToEdit(s => ({...s, is_active: checked}))} />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="button" onClick={handleSaveStation}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!stationToDelete} onOpenChange={() => setStationToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the station
                    and its associated data from our servers.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteStation}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

    
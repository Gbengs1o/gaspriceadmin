"use client"

import { useState, useEffect, useCallback } from "react"
import { PlusCircle, MoreHorizontal, File, Loader2, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce" 
import { NIGERIAN_STATES } from "@/lib/states"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface Station {
  id: number;
  name: string;
  address: string | null;
  state: string | null;
  brand: string | null;
  is_active: boolean;
  submission_count: number;
  total_count: number;
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
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("newest");
  const [allBrands, setAllBrands] = useState<string[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stationToEdit, setStationToEdit] = useState<Partial<Station> | null>(null);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      const { data } = await supabase.from('stations').select('brand').neq('brand', '').is('brand', true);
      if (data) {
        const uniqueBrands = [...new Set(data.map((item: any) => item.brand))];
        setAllBrands(uniqueBrands.sort());
      }
    };
    fetchBrands();
  }, []);

  const fetchStations = useCallback(async () => {
    setIsLoading(true);
    const offset = (currentPage - 1) * STATIONS_PER_PAGE;

    let query = supabase
        .from('stations_with_submission_count')
        .select('*', { count: 'exact' });

    if (debouncedSearchTerm) {
        query = query.or(`name.ilike.%${debouncedSearchTerm}%,address.ilike.%${debouncedSearchTerm}%`);
    }
    if (brandFilter) {
        query = query.eq('brand', brandFilter);
    }
    if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'true');
    }

    if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
    if (sortBy === 'oldest') query = query.order('created_at', { ascending: true });
    if (sortBy === 'submissions_desc') query = query.order('submission_count', { ascending: false });
    
    const { data, error, count } = await query.range(offset, offset + STATIONS_PER_PAGE - 1);

    if (error) {
      console.error("Error fetching stations:", error.message);
      toast({ variant: "destructive", title: "Error", description: error.message });
      setStations([]);
    } else {
        setStations(data || []);
        setTotalStations(count ?? 0);
    }
    setIsLoading(false);
  }, [currentPage, debouncedSearchTerm, brandFilter, statusFilter, sortBy, toast]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, brandFilter, statusFilter, sortBy]);

  const handleSaveStation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const updates = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      state: formData.get('state') as string,
      brand: formData.get('brand') as string,
      is_active: formData.get('is_active') === 'on',
    };

    let error;
    if (stationToEdit?.id) {
      // Editing existing station
      const { error: updateError } = await supabase.from('stations').update(updates).eq('id', stationToEdit.id);
      error = updateError;
    } else {
      // Adding new station
      const { error: insertError } = await supabase.from('stations').insert([updates]);
      error = insertError;
    }

    if (error) {
      toast({ variant: "destructive", title: "Save failed", description: error.message });
    } else {
      toast({ title: "Success", description: `Station has been ${stationToEdit?.id ? 'updated' : 'added'}.` });
      setIsFormOpen(false);
      fetchStations();
    }
    setIsSubmitting(false);
  };
  
  const handleDeleteStation = async () => {
    if (!stationToDelete) return;
    const { error } = await supabase.from('stations').delete().eq('id', stationToDelete.id);
    if (error) {
      toast({ variant: "destructive", title: "Delete failed", description: error.message });
    } else {
      toast({ title: "Success", description: `${stationToDelete.name} has been deleted.` });
      setStationToDelete(null);
      fetchStations();
    }
  };

  const handleToggleStatus = async (station: Station) => {
    const { error } = await supabase.from('stations').update({ is_active: !station.is_active }).eq('id', station.id);
    if (error) {
      toast({ variant: "destructive", title: "Error updating status", description: error.message });
    } else {
      toast({ title: "Success", description: `${station.name} is now ${!station.is_active ? 'Active' : 'Inactive'}.` });
      fetchStations();
    }
  };

  const openFormDialog = (station?: Station) => {
    setStationToEdit(station || { is_active: true });
    setIsFormOpen(true);
  };

  const totalPages = Math.ceil(totalStations / STATIONS_PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Station Management</h1>
          <p className="text-muted-foreground">Search, filter, and manage all stations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled><File className="mr-2 h-4 w-4" /> Export</Button>
          <Button onClick={() => openFormDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Add Station</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or address..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Brands" /></SelectTrigger>
              <SelectContent><SelectItem value="">All Brands</SelectItem>{allBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="true">Active</SelectItem><SelectItem value="false">Inactive</SelectItem></SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort by..." /></SelectTrigger>
              <SelectContent><SelectItem value="newest">Sort by Newest</SelectItem><SelectItem value="oldest">Sort by Oldest</SelectItem><SelectItem value="submissions_desc">Sort by Submissions</SelectItem></SelectContent>
            </Select>
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
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading stations...
                    </div>
                  </TableCell>
                </TableRow>
              ) : stations.length > 0 ? (
                stations.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">
                      <div className="font-semibold">{station.name}</div>
                      <div className="text-xs text-muted-foreground">{station.address || 'No address'}</div>
                    </TableCell>
                    <TableCell>{station.brand || "N/A"}</TableCell>
                    <TableCell>
                        <Badge variant={station.is_active ? "default" : "secondary"}>
                          {station.is_active ? "Active" : "Inactive"}
                        </Badge>
                    </TableCell>
                    <TableCell>{station.submission_count?.toLocaleString() ?? 0}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openFormDialog(station)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(station)}>
                            {station.is_active ? "Set as Inactive" : "Set as Active"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setStationToDelete(station)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No stations found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            {totalStations > 0 ?
                `Showing ${Math.min((currentPage - 1) * STATIONS_PER_PAGE + 1, totalStations)}-${Math.min(currentPage * STATIONS_PER_PAGE, totalStations)} of ${totalStations} stations` :
                "Showing 0 of 0 stations"
            }
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Next</Button>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{stationToEdit?.id ? "Edit Station" : "Add New Station"}</DialogTitle>
                <DialogDescription>
                    Fill in the details for the station. Click save when you're done.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveStation} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" name="name" defaultValue={stationToEdit?.name || ''} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">Address</Label>
                    <Input id="address" name="address" defaultValue={stationToEdit?.address || ''} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="state" className="text-right">State</Label>
                    <Select name="state" defaultValue={stationToEdit?.state || ''}>
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
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="brand" className="text-right">Brand</Label>
                    <Input id="brand" name="brand" defaultValue={stationToEdit?.brand || ''} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="is_active" className="text-right">Active</Label>
                    <Switch id="is_active" name="is_active" defaultChecked={stationToEdit?.is_active} />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save changes
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!stationToDelete} onOpenChange={() => setStationToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the station
                    and all associated price submissions.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteStation}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

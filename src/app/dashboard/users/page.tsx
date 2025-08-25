"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { MoreHorizontal, PlusCircle, Search, User as UserIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// This matches the return type of our new SQL function
interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  created_at: string;
  report_count: number;
}

const USERS_PER_PAGE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const [userToSuspend, setUserToSuspend] = useState<UserProfile | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const offset = (currentPage - 1) * USERS_PER_PAGE;

    const { data, error } = await supabase.rpc('get_paginated_users_with_stats', {
      _search_term: debouncedSearchTerm,
      _limit: USERS_PER_PAGE,
      _offset: offset,
    });

    if (error) {
      console.error("Error fetching users:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setUsers(data || []);
      setTotalUsers(data && data.length > 0 ? data[0].total_count : 0);
    }
    setIsLoading(false);
  }, [currentPage, debouncedSearchTerm, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // TODO: To enable this, add a 'status' column (e.g., TEXT) to your 'profiles' table.
  const handleSuspendUser = async () => {
    if (!userToSuspend) return;
    toast({
        title: "Feature In Development",
        description: "Add a 'status' column to your profiles table to enable this."
    });
    setUserToSuspend(null);
    /*
    const { error } = await supabase
        .from('profiles')
        .update({ status: 'Suspended' }) // Assumes a 'status' column
        .eq('id', userToSuspend.id);
    
    if (error) {
        toast({ variant: "destructive", title: "Action Failed", description: error.message });
    } else {
        toast({ title: "User Suspended", description: `${userToSuspend.full_name} has been suspended.`});
        fetchUsers();
    }
    setUserToSuspend(null);
    */
  };

  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">User Moderation</h1>
            <p className="text-muted-foreground">Manage user accounts and permissions.</p>
        </div>
        <Button disabled> {/* TODO: Invite user logic */}
            <PlusCircle className="mr-2 h-4 w-4" />
            Invite User
        </Button>
      </div>
      <Card>
        <CardHeader className="border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
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
                <TableHead>User</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-48 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
              ) : users.length > 0 ? (
                users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || ''} alt={user.full_name || 'User'} />
                        <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.full_name || "N/A"}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.phone_number || "N/A"}</TableCell>
                  <TableCell>
                    {/* TODO: This is simulated. Add a 'status' column to the profiles table to make it real. */}
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                  <TableCell>{user.report_count.toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(user.created_at), "MMMM d, yyyy")}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem disabled>Edit User</DropdownMenuItem>
                        <DropdownMenuItem disabled>Change Role</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setUserToSuspend(user)}>
                          Suspend User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
              ) : (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">No users found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            {totalUsers > 0 ? `Showing ${Math.min((currentPage - 1) * USERS_PER_PAGE + 1, totalUsers)}-${Math.min(currentPage * USERS_PER_PAGE, totalUsers)} of ${totalUsers} users` : "0 users found"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>Next</Button>
          </div>
        </CardFooter>
      </Card>
      
      <AlertDialog open={!!userToSuspend} onOpenChange={() => setUserToSuspend(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Suspend User?</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to suspend {userToSuspend?.full_name}? They will lose access to the app.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleSuspendUser}>Suspend</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

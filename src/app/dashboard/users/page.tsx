"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { MoreHorizontal, PlusCircle, Search, User as UserIcon, Loader2, Mail, Phone } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
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

// Matches the return type of our new SQL function
interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string;
  report_count: number;
  total_count: number;
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

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const offset = (currentPage - 1) * USERS_PER_PAGE;

    const { data, error } = await supabase.rpc('get_users_for_admin_page', {
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

  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">User Moderation</h1>
            <p className="text-muted-foreground">Manage user accounts and view their activity.</p>
        </div>
        <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" />
            Invite User
        </Button>
      </div>
      <Card>
        <CardHeader className="border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, email, or phone..." 
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
                <TableHead>Provider</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Last Sign In</TableHead>
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
                        <div className="font-medium">{user.full_name || user.email || user.phone || "N/A"}</div>
                        <div className="text-sm text-muted-foreground">{user.email || user.phone}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        {user.provider === 'email' ? <Mail className="h-4 w-4"/> : <Phone className="h-4 w-4"/>}
                        <span className="capitalize">{user.provider}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-center">{user.report_count.toLocaleString()}</TableCell>
                  <TableCell>
                    {user.last_sign_in_at ? `${formatDistanceToNow(new Date(user.last_sign_in_at))} ago` : 'Never'}
                  </TableCell>
                  <TableCell>{format(new Date(user.created_at), "d MMM, yyyy")}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem disabled>Edit User Details</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" disabled>
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
    </div>
  );
}

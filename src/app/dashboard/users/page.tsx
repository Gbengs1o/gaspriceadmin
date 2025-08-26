"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

  // --- State for Search and Filters ---
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [sortBy, setSortBy] = useState("newest");
  const [providerFilter, setProviderFilter] = useState("all");
  const [avatarFilter, setAvatarFilter] = useState("all");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const offset = (currentPage - 1) * USERS_PER_PAGE;

    let hasAvatar: boolean | null = null;
    if (avatarFilter === 'yes') hasAvatar = true;
    if (avatarFilter === 'no') hasAvatar = false;

    // --- UPDATED: Calling the RPC with all filter parameters ---
    const { data, error } = await supabase.rpc('get_users_for_admin_page', {
      _search_term: debouncedSearchTerm,
      _sort_by: sortBy,
      _provider_filter: providerFilter,
      _has_avatar_filter: hasAvatar,
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
  }, [currentPage, debouncedSearchTerm, sortBy, providerFilter, avatarFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Reset to page 1 whenever a filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, sortBy, providerFilter, avatarFilter]);

  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">User Moderation</h1>
            <p className="text-muted-foreground">Manage user accounts and view their activity.</p>
        </div>
        <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Invite User</Button>
      </div>
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email, or phone..." 
                className="pl-10" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            {/* --- NEW: Filter and Sort Dropdowns --- */}
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Providers" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Providers</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="phone">Phone</SelectItem></SelectContent>
            </Select>
            <Select value={avatarFilter} onValueChange={setAvatarFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Avatars" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Avatars</SelectItem><SelectItem value="yes">Has Avatar</SelectItem><SelectItem value="no">No Avatar</SelectItem></SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Sort by..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Sort by: Newest</SelectItem>
                <SelectItem value="oldest">Sort by: Oldest</SelectItem>
                <SelectItem value="last_signin">Sort by: Last Sign In</SelectItem>
                <SelectItem value="submissions_desc">Sort by: Most Submissions</SelectItem>
              </SelectContent>
            </Select>
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
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.full_name || "N/A"}</div>
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
                        <DropdownMenuItem disabled>Edit User</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" disabled>Suspend User</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
              ) : (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">No users found for the current filters.</TableCell></TableRow>
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

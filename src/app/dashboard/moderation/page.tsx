"use client"

import { useState, useEffect, useCallback } from "react"
import { formatDistanceToNow } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User as UserIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Matches the return type of our database function
interface Submission {
  id: number;
  station_name: string;
  user_name: string | null;
  user_avatar: string | null;
  fuel_type: string;
  submitted_price: number;
  average_price: number | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Flagged';
  created_at: string;
}

const SUBMISSIONS_PER_PAGE = 10;

export default function ModerationPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("Pending");
  const { toast } = useToast();

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    const offset = (currentPage - 1) * SUBMISSIONS_PER_PAGE;

    const { data, error } = await supabase.rpc('get_price_submissions_for_moderation', {
      _status_filter: activeTab,
      _limit: SUBMISSIONS_PER_PAGE,
      _offset: offset,
    });

    if (error) {
      console.error("Error fetching submissions:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setSubmissions(data || []);
      setTotalSubmissions(data && data.length > 0 ? data[0].total_count : 0);
    }
    setIsLoading(false);
  }, [currentPage, activeTab, toast]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    setCurrentPage(1); // Reset page when tab changes
  }, [activeTab]);

  const handleUpdateStatus = async (id: number, newStatus: 'Approved' | 'Rejected') => {
    // Optimistically update the UI by removing the item
    setSubmissions(prev => prev.filter(s => s.id !== id));
    
    const { error } = await supabase
      .from('price_reports')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
      fetchSubmissions(); // Re-fetch to revert optimistic update
    } else {
      toast({ title: "Success", description: `Submission has been ${newStatus}.` });
      // The total count will be slightly off until the next full fetch, which is fine.
    }
  };

  const totalPages = Math.ceil(totalSubmissions / SUBMISSIONS_PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
        <Card>
            <CardHeader>
                <CardTitle>Price Submissions</CardTitle>
                <CardDescription>Review and moderate user-submitted fuel prices.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="Pending">Pending</TabsTrigger>
                        <TabsTrigger value="Approved">Approved</TabsTrigger>
                        <TabsTrigger value="Rejected">Rejected</TabsTrigger>
                        {/* You can add a 'Flagged' status later */}
                    </TabsList>
                    <TabsContent value={activeTab} className="mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Submission</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Submitted Price</TableHead>
                                    <TableHead>Avg. Approved Price</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5} className="h-48 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                                ) : submissions.length > 0 ? (
                                    submissions.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.station_name}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                <Avatar className="h-5 w-5"><AvatarImage src={item.user_avatar || ''} /><AvatarFallback><UserIcon className="h-3 w-3" /></AvatarFallback></Avatar>
                                                <span>by {item.user_name || 'Anonymous'} - {formatDistanceToNow(new Date(item.created_at))} ago</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.fuel_type}</TableCell>
                                        <TableCell className="font-bold">₦{item.submitted_price.toFixed(2)}</TableCell>
                                        <TableCell>
                                            {item.average_price ? `₦${item.average_price.toFixed(2)}` : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {activeTab === 'Pending' && (
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(item.id, 'Approved')}>Approve</Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(item.id, 'Rejected')}>Reject</Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">No {activeTab.toLowerCase()} submissions found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                    {totalSubmissions > 0 ? `Page ${currentPage} of ${totalPages}` : "0 submissions"}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>Next</Button>
                </div>
            </CardFooter>
        </Card>
    </div>
  )
}


"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { supabase } from "@/lib/supabase"
import { NIGERIAN_STATES } from "@/lib/states"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const reportFormSchema = z.object({
  region: z.string({ required_error: "Please select a region." }),
  dateRange: z.object({
    from: z.date({ required_error: "A start date is required." }),
    to: z.date({ required_error: "An end date is required." }),
  }),
  format: z.string({ required_error: "Please select a format." }),
});

// Type for the fetched report data
type ReportData = {
    "Submitted At": string;
    "Station Name": string | null;
    "Station Address": string | null;
    "Fuel Type": string | null;
    "Price": number | null;
    "User Name": string | null;
    "User Email": string | null;
};


export default function ReportsPage() {
    const { toast } = useToast()
    const [isGenerating, setIsGenerating] = useState(false);

    const form = useForm<z.infer<typeof reportFormSchema>>({
        resolver: zodResolver(reportFormSchema),
        defaultValues: {
            region: "all",
            format: "csv",
            dateRange: {
                from: new Date(new Date().setMonth(new Date().getMonth() -1)),
                to: new Date()
            }
        }
    })
    
    // --- Data Fetching Logic ---
    async function getReportData(values: z.infer<typeof reportFormSchema>): Promise<ReportData[]> {
        const { region, dateRange } = values;

        let query = supabase
            .from('price_reports')
            .select(`
                created_at,
                price,
                fuel_type,
                stations ( name, address, state ),
                profiles ( full_name, email )
            `)
            .gte('created_at', dateRange.from.toISOString())
            .lte('created_at', dateRange.to.toISOString())
            .order('created_at', { ascending: false });

        if (region !== "all") {
            query = query.eq('stations.state', region);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching report data:", error);
            throw new Error(error.message);
        }

        // Format data into a flatter structure for the report
        return data.map((row: any) => ({
            "Submitted At": format(new Date(row.created_at), "yyyy-MM-dd HH:mm:ss"),
            "Station Name": row.stations?.name,
            "Station Address": row.stations?.address,
            "Fuel Type": row.fuel_type,
            "Price": row.price,
            "User Name": row.profiles?.full_name,
            "User Email": row.profiles?.email,
        }));
    }

    // --- CSV Generation and Download Logic ---
    function downloadCsv(data: ReportData[], fileName: string) {
        if (!data.length) {
            toast({ variant: "destructive", title: "No Data", description: "No data found for the selected criteria." });
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','), // Header row
            ...data.map(row => 
                headers.map(fieldName => {
                    let cell = row[fieldName as keyof ReportData] === null || row[fieldName as keyof ReportData] === undefined 
                               ? '' 
                               : `"${String(row[fieldName as keyof ReportData]).replace(/"/g, '""')}"`;
                    return cell;
                }).join(',')
            )
        ];
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Report Downloaded",
            description: `Your CSV report "${fileName}.csv" has been downloaded.`,
        })
    }


    async function onSubmit(data: z.infer<typeof reportFormSchema>) {
        setIsGenerating(true);
        try {
            toast({
                title: "Report Generating...",
                description: "Fetching data for your report. Please wait.",
            });

            const reportData = await getReportData(data);

            if (data.format === 'csv') {
                const fileName = `FYND_FUEL_Report_${data.region}_${format(data.dateRange.from, 'yyyy-MM-dd')}_to_${format(data.dateRange.to, 'yyyy-MM-dd')}`;
                downloadCsv(reportData, fileName);
            } else {
                 toast({ variant: "destructive", title: "Format Not Supported", description: `${data.format.toUpperCase()} export is not yet implemented.` });
            }

        } catch (error: any) {
            toast({ variant: "destructive", title: "Generation Failed", description: error.message || "An unknown error occurred." });
        } finally {
            setIsGenerating(false);
        }
    }

  return (
    <div className="flex flex-col gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Report Generation</h1>
            <p className="text-muted-foreground">Export fuel pricing reports for specific dates or regions.</p>
        </div>
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Generate New Report</CardTitle>
                <CardDescription>Select your criteria to generate a report.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Region/State</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a region or state" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="all">All Nigeria</SelectItem>
                                {NIGERIAN_STATES.map(state => (
                                    <SelectItem key={state} value={state}>{state}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="dateRange"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date range</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[300px] pl-3 text-left font-normal",
                                    !field.value?.from && "text-muted-foreground"
                                )}
                                >
                                {field.value?.from ? (
                                    field.value.to ? (
                                    <>
                                        {format(field.value.from, "LLL dd, y")} -{" "}
                                        {format(field.value.to, "LLL dd, y")}
                                    </>
                                    ) : (
                                    format(field.value.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="range"
                                selected={field.value}
                                onSelect={field.onChange}
                                numberOfMonths={2}
                                initialFocus
                                disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Export Format</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an export format" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="csv">CSV</SelectItem>
                                <SelectItem value="pdf" disabled>PDF (coming soon)</SelectItem>
                                <SelectItem value="xlsx" disabled>Excel (XLSX, coming soon)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate and Export
                    </Button>
                </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  )
}

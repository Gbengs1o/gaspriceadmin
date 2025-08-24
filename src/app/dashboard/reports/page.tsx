"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

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

export default function ReportsPage() {
    const { toast } = useToast()

    const form = useForm<z.infer<typeof reportFormSchema>>({
        resolver: zodResolver(reportFormSchema),
        defaultValues: {
            region: "all",
            format: "csv"
        }
    })

    function onSubmit(data: z.infer<typeof reportFormSchema>) {
        console.log(data);
        toast({
            title: "Report Generating...",
            description: "Your report is being prepared and will be downloaded shortly.",
        })
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
                                <SelectItem value="lagos">Lagos</SelectItem>
                                <SelectItem value="abuja">Abuja</SelectItem>
                                <SelectItem value="rivers">Rivers</SelectItem>
                                <SelectItem value="kano">Kano</SelectItem>
                                <SelectItem value="oyo">Oyo</SelectItem>
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
                                    <span>Pick a date</span>
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
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit">Generate and Export</Button>
                </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  )
}

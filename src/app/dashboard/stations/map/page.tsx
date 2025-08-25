// app/dashboard/stations/map/page.tsx

"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps"
import { supabase } from "@/lib/supabase"
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Updated interface to include all our new data
interface MapStation {
    id: number
    name: string
    address: string | null
    latitude: number
    longitude: number
    brand: string | null
    is_active: boolean
    submission_count: number
}

// Center of Nigeria
const NIGERIA_CENTER = { lat: 9.0820, lng: 8.6753 }

export default function StationsMapPage() {
    const [stations, setStations] = useState<MapStation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [openInfoWindowId, setOpenInfoWindowId] = useState<number | null>(null);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    useEffect(() => {
        const fetchStations = async () => {
            setLoading(true)
            setError(null)
            
            // --- THE FIX: Fetch data from our new, efficient VIEW ---
            const { data, error } = await supabase
                .from('stations_map_details') // Querying the view
                .select('*')

            if (error) {
                console.error("Error fetching station locations:", error.message)
                setError("Failed to load station data. Ensure the 'stations_map_details' VIEW exists.")
                setStations([])
            } else {
                setStations(data as MapStation[])
            }
            setLoading(false)
        }

        if (!apiKey) {
            setError("Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.")
            setLoading(false)
        } else {
            fetchStations()
        }
    }, [apiKey])

    if (loading) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading Map and Stations...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-96 w-full items-center justify-center rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
                <p className="text-destructive-foreground">{error}</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
             <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Stations Map View</h1>
                    <p className="text-muted-foreground">A geographical overview of all station locations.</p>
                </div>
                <Link href="/dashboard/stations">
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to List View</Button>
                </Link>
            </div>
            <div className="h-[75svh] w-full rounded-lg overflow-hidden border">
                <APIProvider apiKey={apiKey!}>
                    <Map
                        defaultCenter={NIGERIA_CENTER}
                        defaultZoom={6}
                        gestureHandling={'greedy'}
                        disableDefaultUI={false}
                        mapId="gasprice-nigeria-admin-map"
                        streetViewControl={false}
                        fullscreenControl={false}
                    >
                        {stations.map((station) => (
                           <AdvancedMarker
                               key={station.id}
                               position={{ lat: station.latitude, lng: station.longitude }}
                               onClick={() => setOpenInfoWindowId(station.id)}
                               title={station.name} // This adds a native browser tooltip on hover!
                           >
                               {/* --- IMPROVEMENT: Color-coded pins --- */}
                               <Pin 
                                 background={station.is_active ? '#10B981' : '#6B7280'} // Green for active, Gray for inactive
                                 borderColor={station.is_active ? '#059669' : '#4B5563'}
                                 glyphColor={"#ffffff"}
                               />
                           </AdvancedMarker>
                        ))}
                        
                        {/* Logic to show the InfoWindow for the selected station */}
                        {openInfoWindowId && stations.find(s => s.id === openInfoWindowId) && (
                            <InfoWindow
                                position={{ 
                                    lat: stations.find(s => s.id === openInfoWindowId)!.latitude, 
                                    lng: stations.find(s => s.id === openInfoWindowId)!.longitude 
                                }}
                                onCloseClick={() => setOpenInfoWindowId(null)}
                                pixelOffset={[0, -35]} // Adjust position to be above the pin
                            >
                                {/* --- IMPROVEMENT: Enhanced InfoWindow Content --- */}
                                <div className="p-1 max-w-sm">
                                    <h3 className="font-bold text-base mb-1">{stations.find(s => s.id === openInfoWindowId)!.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-2">{stations.find(s => s.id === openInfoWindowId)!.address || "No address"}</p>
                                    <div className="flex items-center justify-between mb-3 text-xs">
                                        <Badge variant={stations.find(s => s.id === openInfoWindowId)!.is_active ? "default" : "secondary"}>
                                            {stations.find(s => s.id === openInfoWindowId)!.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                        {stations.find(s => s.id === openInfoWindowId)!.brand && <Badge variant="outline">{stations.find(s => s.id === openInfoWindowId)!.brand}</Badge>}
                                        <span className="text-muted-foreground">{stations.find(s => s.id === openInfoWindowId)!.submission_count} submissions</span>
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${stations.find(s => s.id === openInfoWindowId)!.latitude},${stations.find(s => s.id === openInfoWindowId)!.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button size="sm" className="w-full">
                                            <ExternalLink className="mr-2 h-4 w-4" /> View on Google Maps
                                        </Button>
                                    </a>
                                </div>
                            </InfoWindow>
                        )}
                    </Map>
                </APIProvider>
            </div>
        </div>
    )
}

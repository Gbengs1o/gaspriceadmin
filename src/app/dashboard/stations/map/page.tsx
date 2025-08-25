"use client"

import { useState, useEffect } from "react"
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface Station {
    id: number
    name: string
    latitude: number
    longitude: number
}

// Center of Nigeria
const NIGERIA_CENTER = { lat: 9.0820, lng: 8.6753 }

export default function StationsMapPage() {
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // IMPORTANT: You need to create a .env.local file and add your Google Maps API Key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    useEffect(() => {
        const fetchStations = async () => {
            setLoading(true)
            setError(null)
            
            // Fetch all stations with valid latitude and longitude
            const { data, error } = await supabase
                .from('stations')
                .select('id, name, latitude, longitude')
                .not('latitude', 'is', null)
                .not('longitude', 'is', null)

            if (error) {
                console.error("Error fetching station locations:", error)
                setError("Failed to load station data. Please ensure your 'stations' table has 'latitude' and 'longitude' columns.")
                setStations([])
            } else {
                setStations(data)
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
             <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline">Stations Map</h1>
                <p className="text-muted-foreground">A geographical overview of all station locations.</p>
            </div>
            <div className="h-[70svh] w-full rounded-lg overflow-hidden border">
                <APIProvider apiKey={apiKey!}>
                    <Map
                        defaultCenter={NIGERIA_CENTER}
                        defaultZoom={6}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        mapId="gasprice-nigeria-map"
                    >
                        {stations.map((station) => (
                            <AdvancedMarker
                                key={station.id}
                                position={{ lat: station.latitude, lng: station.longitude }}
                                title={station.name}
                            >
                                <Pin />
                            </AdvancedMarker>
                        ))}
                    </Map>
                </APIProvider>
            </div>
        </div>
    )
}

    
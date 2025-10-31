import React, { useState, useEffect } from 'react'
import { MapPin, Music, Calendar, Loader } from 'lucide-react'
import { VenueManagementCard } from './VenueManagementCard'
import { ArtistManagementCard } from './ArtistManagementCard'
import { useAuth } from '../hooks/useAuth'
import { supabase, type Venue, type Artist, type Event } from '../lib/supabase'

interface VenueWithEvents {
  venue: Venue
  events: Event[]
}

interface ArtistWithEvents {
  artist: Artist
  events: Event[]
}

export const ManagementSection: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [venues, setVenues] = useState<VenueWithEvents[]>([])
  const [artists, setArtists] = useState<ArtistWithEvents[]>([])
  const [activeSection, setActiveSection] = useState<'venues' | 'artists'>('venues')

  useEffect(() => {
    if (user) {
      fetchManagementData()
    }
  }, [user])

  const fetchManagementData = async () => {
    if (!user) return

    setLoading(true)
    try {
      await Promise.all([
        fetchUserVenues(),
        fetchUserArtists()
      ])
    } catch (error) {
      console.error('Error fetching management data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserVenues = async () => {
    if (!user) return

    const { data: venuesData, error: venuesError } = await supabase
      .from('venues')
      .select('*')
      .eq('created_by', user.id)
      .order('name')

    if (venuesError) {
      console.error('Error fetching venues:', venuesError)
      return
    }

    if (!venuesData || venuesData.length === 0) {
      setVenues([])
      return
    }

    const venuesWithEvents: VenueWithEvents[] = await Promise.all(
      venuesData.map(async (venue) => {
        const { data: eventsData } = await supabase
          .from('events')
          .select(`
            *,
            venue:venues(*),
            event_artists(artist:artists(*))
          `)
          .eq('venue_id', venue.id)
          .order('start_date', { ascending: false })

        return {
          venue,
          events: eventsData || []
        }
      })
    )

    setVenues(venuesWithEvents)
  }

  const fetchUserArtists = async () => {
    if (!user) return

    const { data: artistsData, error: artistsError } = await supabase
      .from('artists')
      .select('*')
      .eq('created_by', user.id)
      .order('name')

    if (artistsError) {
      console.error('Error fetching artists:', artistsError)
      return
    }

    if (!artistsData || artistsData.length === 0) {
      setArtists([])
      return
    }

    const artistsWithEvents: ArtistWithEvents[] = await Promise.all(
      artistsData.map(async (artist) => {
        const { data: eventArtistsData } = await supabase
          .from('event_artists')
          .select(`
            event:events(
              *,
              venue:venues(*),
              event_artists(artist:artists(*))
            )
          `)
          .eq('artist_id', artist.id)

        const events = eventArtistsData
          ?.map((ea: any) => ea.event)
          .filter(Boolean)
          .sort((a: Event, b: Event) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          ) || []

        return {
          artist,
          events
        }
      })
    )

    setArtists(artistsWithEvents)
  }

  const canEditEvent = (event: Event): boolean => {
    if (!user) return false

    if (event.created_by === user.id) return true

    if (event.venue_id) {
      const venueOwned = venues.some(v => v.venue.id === event.venue_id)
      if (venueOwned) return true
    }

    if (event.event_artists && event.event_artists.length > 0) {
      const artistOwned = event.event_artists.some((ea: any) =>
        artists.some(a => a.artist.id === ea.artist?.id)
      )
      if (artistOwned) return true
    }

    return false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-gray-400" size={32} />
      </div>
    )
  }

  const hasVenues = venues.length > 0
  const hasArtists = artists.length > 0
  const hasContent = hasVenues || hasArtists

  if (!hasContent) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-gray-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Content to Manage Yet
          </h3>
          <p className="text-gray-600 mb-6">
            You haven't created any venues or artists yet. Get started by adding your first venue or artist profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://seveneightfive.fillout.com/add-venue"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 bg-[#FFCE03] hover:bg-[#E5B902] text-black px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
            >
              <MapPin size={18} />
              <span>Add Venue</span>
            </a>
            <a
              href="https://seveneightfive.fillout.com/new-artist"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 bg-[#FFCE03] hover:bg-[#E5B902] text-black px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
            >
              <Music size={18} />
              <span>Add Artist</span>
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Management</h2>
        <p className="text-gray-600 mb-6">
          Manage your venues, artists, and their associated events. You can edit events directly or update venue and artist information through the edit links.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <a
            href="https://seveneightfive.fillout.com/add-venue"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 bg-[#FFCE03] hover:bg-[#E5B902] text-black px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
          >
            <MapPin size={18} />
            <span>Add Venue</span>
          </a>
          <a
            href="https://seveneightfive.fillout.com/new-artist"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 bg-[#FFCE03] hover:bg-[#E5B902] text-black px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
          >
            <Music size={18} />
            <span>Add Artist</span>
          </a>
        </div>

        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveSection('venues')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeSection === 'venues'
                ? 'border-[#FFCE03] text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MapPin size={18} />
              <span>My Venues ({venues.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveSection('artists')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeSection === 'artists'
                ? 'border-[#FFCE03] text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Music size={18} />
              <span>My Artists ({artists.length})</span>
            </div>
          </button>
        </div>
      </div>

      {activeSection === 'venues' && (
        <div className="space-y-4">
          {hasVenues ? (
            venues.map(({ venue, events }) => (
              <VenueManagementCard
                key={venue.id}
                venue={venue}
                events={events}
                onEventUpdate={fetchManagementData}
                canEditEvent={canEditEvent}
              />
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Venues Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first venue to start managing events and listings.
              </p>
              <a
                href="https://seveneightfive.fillout.com/add-venue"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-[#FFCE03] hover:bg-[#E5B902] text-black px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
              >
                <MapPin size={18} />
                <span>Add Venue</span>
              </a>
            </div>
          )}
        </div>
      )}

      {activeSection === 'artists' && (
        <div className="space-y-4">
          {hasArtists ? (
            artists.map(({ artist, events }) => (
              <ArtistManagementCard
                key={artist.id}
                artist={artist}
                events={events}
                onEventUpdate={fetchManagementData}
                canEditEvent={canEditEvent}
              />
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <Music className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Artists Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first artist profile to start managing performances and events.
              </p>
              <a
                href="https://seveneightfive.fillout.com/new-artist"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-[#FFCE03] hover:bg-[#E5B902] text-black px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
              >
                <Music size={18} />
                <span>Add Artist</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

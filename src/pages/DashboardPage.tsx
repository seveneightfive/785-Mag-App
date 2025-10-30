import React, { useState, useEffect, useRef } from 'react'
import { Calendar, Music, MapPin, User, Clock, TrendingUp, ExternalLink, BarChart3, Edit2, DollarSign, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { ProjectCard } from '../components/ProjectCard'
import { TaskItem } from '../components/TaskItem'
import { StatCard } from '../components/StatCard'
import { CalendarEvent } from '../components/CalendarEvent'
import { AdManagementSection } from '../components/AdManagementSection'
import { ManagementSection } from '../components/ManagementSection'
import { useAuth } from '../hooks/useAuth'
import { supabase, type Event, type Artist, type Venue, trackPageView } from '../lib/supabase'

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [followedArtists, setFollowedArtists] = useState<Artist[]>([])
  const [followedVenues, setFollowedVenues] = useState<Venue[]>([])
  const [rsvpEvents, setRsvpEvents] = useState<Event[]>([])
  const [interestedEvents, setInterestedEvents] = useState<Event[]>([])
  const [allUpcomingEvents, setAllUpcomingEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'management' | 'ads'>('dashboard')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    trackPageView('dashboard')
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      const { data: artistFollows } = await supabase
        .from('follows')
        .select(`
          *,
          artist:artists(*)
        `)
        .eq('follower_id', user.id)
        .eq('entity_type', 'artist')

      if (artistFollows) {
        const artists = artistFollows.map(follow => follow.artist).filter(Boolean)
        setFollowedArtists(artists)
      }

      const { data: venueFollows } = await supabase
        .from('follows')
        .select(`
          *,
          venue:venues(*)
        `)
        .eq('follower_id', user.id)
        .eq('entity_type', 'venue')

      if (venueFollows) {
        const venues = venueFollows.map(follow => follow.venue).filter(Boolean)
        setFollowedVenues(venues)
      }

      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          event:events(
            *,
            venue:venues(*),
            event_artists(artist:artists(*))
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'going')
        .gte('event.start_date', new Date().toISOString())

      if (rsvps) {
        const events = rsvps.map(rsvp => rsvp.event).filter(Boolean)
        setRsvpEvents(events)
      }

      const { data: interestedRsvps } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          event:events(
            *,
            venue:venues(*),
            event_artists(artist:artists(*))
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'interested')
        .gte('event.start_date', new Date().toISOString())

      if (interestedRsvps) {
        const events = interestedRsvps.map(rsvp => rsvp.event).filter(Boolean)
        setInterestedEvents(events)
      }

      const allEvents = [...(rsvps?.map(r => r.event).filter(Boolean) || []), ...(interestedRsvps?.map(r => r.event).filter(Boolean) || [])]
      const uniqueEvents = Array.from(new Map(allEvents.map(e => [e.id, e])).values())
      uniqueEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      setAllUpcomingEvents(uniqueEvents)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePercentage = (current: number, max: number = 100) => {
    if (max === 0) return 0
    return Math.min(Math.round((current / max) * 100), 100)
  }

  const getArtistImages = () => {
    return followedArtists.slice(0, 5).map(artist => artist.image_url || artist.avatar_url || '').filter(Boolean)
  }

  const getVenueImages = () => {
    return followedVenues.slice(0, 5).map(venue => venue.image_url || '').filter(Boolean)
  }

  const getEventImages = () => {
    return rsvpEvents.slice(0, 5).map(event => event.image_url || '').filter(Boolean)
  }

  const formatDate = () => {
    const now = new Date()
    const day = now.toLocaleDateString('en-US', { weekday: 'long' })
    const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    return { day, date }
  }

  const formatEventTime = (event: Event) => {
    const date = new Date(event.start_date)
    const time = event.event_start_time || date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    return time
  }

  const groupEventsByDate = (events: Event[]) => {
    const groups: { [key: string]: Event[] } = {}
    events.forEach(event => {
      const dateKey = new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
    })
    return groups
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    try {
      setUploadingAvatar(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      window.location.reload()
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload avatar. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#F5F1EB]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
            <p className="text-gray-600">You need to be signed in to view your dashboard.</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#F5F1EB]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    )
  }

  const { day, date } = formatDate()
  const eventGroups = groupEventsByDate(allUpcomingEvents)

  return (
    <Layout>
      <div className="min-h-screen bg-[#F5F1EB]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Sidebar - User Profile */}
            <aside className="lg:col-span-3">
              <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-3">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-white" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-[#FFCE03] hover:bg-[#E5B902] rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
                    >
                      <Edit2 size={14} className="text-black" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 text-center">
                    {profile?.full_name || profile?.username || 'User'}
                  </h3>
                  <p className="text-sm text-gray-500 text-center break-all">
                    {profile?.email || user.email}
                  </p>
                  {profile?.phone && (
                    <p className="text-sm text-gray-500 text-center">
                      {profile.phone}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <nav className="space-y-1 mb-6">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeTab === 'dashboard'
                        ? 'bg-black text-yellow-400'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 size={18} />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('management')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeTab === 'management'
                        ? 'bg-black text-yellow-400'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Settings size={18} />
                    <span>Management</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('ads')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeTab === 'ads'
                        ? 'bg-black text-yellow-400'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <DollarSign size={18} />
                    <span>Advertisements</span>
                  </button>
                  <button
                    onClick={() => navigate('/events')}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  >
                    <Calendar size={18} />
                    <span>Analytics</span>
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  >
                    <User size={18} />
                    <span>Setting</span>
                  </button>
                </nav>

                <div className="space-y-3">
                  <a
                    href="https://seveneightfive.fillout.com/add-venue"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 bg-[#FFCE03] hover:bg-[#E5B902] text-black px-4 py-3 rounded-lg font-semibold transition-colors shadow-sm"
                  >
                    <MapPin size={18} />
                    <span>Add New Venue</span>
                    <ExternalLink size={14} />
                  </a>
                  <a
                    href="https://seveneightfive.fillout.com/new-artist"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 bg-[#FFCE03] hover:bg-[#E5B902] text-black px-4 py-3 rounded-lg font-semibold transition-colors shadow-sm"
                  >
                    <Music size={18} />
                    <span>Add New Artist</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-6">
              {activeTab === 'dashboard' ? (
                <>
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">
                          Hello, {profile?.full_name?.split(' ')[0] || profile?.username || 'there'}
                        </h1>
                        <p className="text-gray-600">Today is {day}, {date}</p>
                      </div>
                      <a
                        href="https://seveneightfive.fillout.com/t/fVFVYBpMXKus"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#FFCE03] hover:bg-[#E5B902] text-black px-6 py-2.5 rounded-lg font-semibold transition-colors shadow-sm flex items-center space-x-2"
                      >
                        <span>Add New Event</span>
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>

                  {/* Calendar */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Calendar</h2>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <Calendar className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>

                    <div className="space-y-6 max-h-[600px] overflow-y-auto">
                      {Object.entries(eventGroups).map(([dateKey, events]) => (
                        <div key={dateKey}>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">{dateKey}</h3>
                          <div className="space-y-2">
                            {events.map(event => (
                              <CalendarEvent
                                key={event.id}
                                time={formatEventTime(event)}
                                title={event.title}
                                subtitle={event.venue?.name || 'Event'}
                                onClick={() => navigate(`/events/${event.slug}`)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                      {allUpcomingEvents.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                          <Calendar size={48} className="mx-auto mb-3" />
                          <p className="text-sm">No upcoming events</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : activeTab === 'management' ? (
                <ManagementSection />
              ) : (
                <AdManagementSection />
              )}
            </main>

            {/* Right Sidebar - Project Cards */}
            <aside className="lg:col-span-3 space-y-4">
              <ProjectCard
                title="Artists"
                subtitle="Following"
                taskCount={followedArtists.length}
                percentage={calculatePercentage(followedArtists.length, 20)}
                color="purple"
                images={getArtistImages()}
                onClick={() => navigate('/artists')}
              />
              <ProjectCard
                title="Venues"
                subtitle="Following"
                taskCount={followedVenues.length}
                percentage={calculatePercentage(followedVenues.length, 15)}
                color="teal"
                images={getVenueImages()}
                onClick={() => navigate('/venues')}
              />
              <ProjectCard
                title="Events"
                subtitle="Attending"
                taskCount={rsvpEvents.length}
                percentage={calculatePercentage(rsvpEvents.length, 10)}
                color="coral"
                images={getEventImages()}
                onClick={() => navigate('/events')}
              />
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  )
}

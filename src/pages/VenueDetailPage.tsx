import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Phone, Globe, Heart, Share2, ArrowLeft, Users, Calendar } from 'lucide-react'
import { Layout } from '../components/Layout'
import { ReviewSection } from '../components/ReviewSection'
import { EventCard } from '../components/EventCard'
import { MenuProcCard } from '../components/MenuProcCard'
import { MenuProcModal } from '../components/MenuProcModal'
import { MenuProcForm } from '../components/MenuProcForm'
import { useAuth } from '../hooks/useAuth'
import { supabase, type Venue, type Event, type MenuProc, trackPageView } from '../lib/supabase'

export const VenueDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [menuProcs, setMenuProcs] = useState<MenuProc[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [selectedMenuProc, setSelectedMenuProc] = useState<MenuProc | null>(null)
  const [showMenuProcModal, setShowMenuProcModal] = useState(false)
  const [showMenuProcForm, setShowMenuProcForm] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchVenue()
      fetchVenueEvents()
    }
  }, [slug])

  useEffect(() => {
    if (venue && user) {
      checkFollowStatus()
    }
    if (venue) {
      fetchMenuProcs()
    }
  }, [venue, user])

  const fetchVenue = async () => {
    if (!slug) return

    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching venue:', error)
      navigate('/venues')
      return
    }

    setVenue(data)
    trackPageView('venue', data.id)
    setLoading(false)
  }

  const fetchVenueEvents = async () => {
    if (!slug) return

    const { data } = await supabase
      .from('events')
      .select(`
        *,
        venue:venues!inner(slug),
        event_artists(
          artist:artists(*)
        )
      `)
      .eq('venue.slug', slug)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })

    if (data) {
      setEvents(data)
    }
  }

  const fetchMenuProcs = async () => {
    if (!venue) return

    const { data } = await supabase
      .from('menu_procs')
      .select(`
        *,
        venue:venues(*),
        user:profiles(username, full_name)
      `)
      .eq('venue_id', venue.id)
      .order('created_at', { ascending: false })

    if (data) {
      setMenuProcs(data)
    }
  }

  const checkFollowStatus = async () => {
    if (!venue || !user) return

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('entity_type', 'venue')
      .eq('entity_id', venue.id)
      .single()

    setIsFollowing(!!data)
  }

  const handleFollow = async () => {
    if (!user || !venue) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('entity_type', 'venue')
          .eq('entity_id', venue.id)
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            entity_type: 'venue',
            entity_id: venue.id
          })
      }
      setIsFollowing(!isFollowing)
    } catch (error) {
      console.error('Error following venue:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: venue?.name,
          text: venue?.description,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const handleMenuProcClick = (menuProc: MenuProc) => {
    setSelectedMenuProc(menuProc)
    setShowMenuProcModal(true)
  }

  const isRestaurantOrBar = venue?.venue_type === 'Restaurant' || venue?.venue_type === 'Bar/Tavern'

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </Layout>
    )
  }

  if (!venue) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue not found</h1>
            <button
              onClick={() => navigate('/venues')}
              className="text-teal-600 hover:text-teal-700"
            >
              Back to Venues
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        
        {/* Desktop Full-Width Hero */}
        <div className="hidden lg:block relative h-[60vh] overflow-hidden">
          {venue.image_url ? (
            <img
              src={venue.image_url}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
              <MapPin size={120} className="text-white opacity-80" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          
          {/* Venue Name - Reverse Type */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-6xl font-bold text-white drop-shadow-lg font-oswald">
                    {venue.name.toUpperCase()}
                  </h1>
                  <div className="flex items-center space-x-4 mt-4">
                    <span className="bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-lg font-medium">
                      {venue.venue_type}
                    </span>
                    {venue.capacity && (
                      <div className="flex items-center text-white/90">
                        <Users size={20} className="mr-2" />
                        <span className="text-lg">Capacity: {venue.capacity}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleShare}
                    className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Share2 size={24} />
                  </button>
                  {user && (
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`p-3 rounded-full backdrop-blur-sm transition-colors ${
                        isFollowing 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Heart size={24} fill={isFollowing ? 'currentColor' : 'none'} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Hero */}
        <div className="lg:hidden aspect-[16/9] relative overflow-hidden">
          {venue.image_url ? (
            <img
              src={venue.image_url}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
              <MapPin size={64} className="text-white opacity-80" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-2xl font-bold text-white font-oswald">
              {venue.name.toUpperCase()}
            </h1>
            <div className="flex items-center mt-2">
              <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
                {venue.venue_type}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate('/venues')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Venues
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Venue Info */}
              <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                {/* Venue Logo */}
                {venue.logo && (
                  <div className="mb-6">
                    <div className="w-[150px] h-[150px] rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img
                        src={venue.logo}
                        alt={`${venue.name} logo`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="flex items-start text-gray-700">
                    <MapPin size={20} className="mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">{venue.address}</div>
                      <div className="text-sm text-gray-500">
                        {venue.city}, {venue.state} {venue.country}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    {venue.phone && (
                      <a
                        href={`tel:${venue.phone}`}
                        className="flex items-center text-blue-600 hover:text-blue-700"
                      >
                        <Phone size={16} className="mr-2" />
                        <span className="text-sm">{venue.phone}</span>
                      </a>
                    )}
                    {venue.website && (
                      <a
                        href={venue.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-700"
                      >
                        <Globe size={16} className="mr-2" />
                        <span className="text-sm">Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {venue.description && (
                <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Venue</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {venue.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Menu Procs Section */}
              {isRestaurantOrBar && (
                <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Menu Procs</h2>
                    <button
                      onClick={() => setShowMenuProcForm(true)}
                      className="btn-yellow text-sm"
                    >
                      Add Menu Proc
                    </button>
                  </div>
                  
                  {menuProcs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {menuProcs.map((menuProc) => (
                        <MenuProcCard
                          key={menuProc.id}
                          menuProc={menuProc}
                          onClick={() => handleMenuProcClick(menuProc)}
                          showVenue={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <span className="text-4xl mb-4 block">🍽️</span>
                      <p>No Menu Procs yet. Be the first to share your favorite dish!</p>
                      <button
                        onClick={() => setShowMenuProcForm(true)}
                        className="btn-yellow mt-4"
                      >
                        Create Menu Proc
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Upcoming Events */}
              {events.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Events</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {events.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Address</h3>
                    <p className="text-gray-600">
                      {venue.address}<br />
                      {venue.city}, {venue.state} {venue.country}
                    </p>
                  </div>
                  {venue.phone && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Phone</h3>
                      <a
                        href={`tel:${venue.phone}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {venue.phone}
                      </a>
                    </div>
                  )}
                  {venue.email && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Email</h3>
                      <a
                        href={`mailto:${venue.email}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {venue.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-8">
            <ReviewSection entityType="venue" entityId={venue.id} createdBy={venue.created_by} />
          </div>
        </div>
      </div>
        <MenuProcModal
          menuProc={selectedMenuProc}
          isOpen={showMenuProcModal}
          onClose={() => {
            setShowMenuProcModal(false)
            setSelectedMenuProc(null)
          }}
        />

        <MenuProcForm
          isOpen={showMenuProcForm}
          onClose={() => setShowMenuProcForm(false)}
          onSuccess={() => {
            fetchMenuProcs()
          }}
          preselectedVenue={venue}
        />
    </Layout>
  )
}
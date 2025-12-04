import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Building2,
  Globe,
  Heart,
  Share2,
  ArrowLeft,
  Star,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Eye,
  Users,
  Facebook,
  Twitter,
  Instagram
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { EventModal } from '../components/EventModal'
import { ShareModal } from '../components/ShareModal'
import { useAuth } from '../hooks/useAuth'
import { supabase, type Organizer, type Event, trackPageView } from '../lib/supabase'

export const OrganizerDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [pageViews, setPageViews] = useState(0)
  const [totalEventsCount, setTotalEventsCount] = useState(0)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  const eventSlugFromUrl = searchParams.get('event')
  const isEventModalOpen = !!eventSlugFromUrl

  useEffect(() => {
    if (slug) {
      fetchOrganizer()
      fetchOrganizerEvents()
    }
  }, [slug])

  useEffect(() => {
    if (organizer) {
      fetchOrganizerStats()
    }
  }, [organizer])

  useEffect(() => {
    if (organizer && user) {
      checkFollowStatus()
    }
  }, [organizer, user])

  const fetchOrganizer = async () => {
    if (!slug) return

    const { data, error } = await supabase
      .from('organizers')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching organizer:', error)
      navigate('/organizers')
      return
    }

    setOrganizer(data)
    trackPageView('organizer', data.id)
    setLoading(false)
  }

  const fetchOrganizerEvents = async () => {
    if (!slug) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('events')
      .select(`
        *,
        venue:venues(*),
        event_organizers!inner(organizer:organizers!inner(slug))
      `)
      .eq('event_organizers.organizer.slug', slug)
      .gte('start_date', today.toISOString())
      .order('start_date', { ascending: true })

    if (data) {
      setEvents(data)
    }
  }

  const fetchOrganizerStats = async () => {
    if (!organizer) return

    const { count: followersCount } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', 'organizer')
      .eq('entity_id', organizer.id)

    setFollowersCount(followersCount || 0)

    const { count: viewsCount } = await supabase
      .from('page_views')
      .select('id', { count: 'exact', head: true })
      .eq('page_type', 'organizer')
      .eq('page_id', organizer.id)

    setPageViews(viewsCount || 0)

    const { count: totalEvents } = await supabase
      .from('event_organizers')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', organizer.id)

    setTotalEventsCount(totalEvents || 0)
  }

  const checkFollowStatus = async () => {
    if (!organizer || !user) return

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('entity_type', 'organizer')
      .eq('entity_id', organizer.id)
      .maybeSingle()

    setIsFollowing(!!data)
  }

  const handleFollow = async () => {
    if (!user || !organizer) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('entity_type', 'organizer')
          .eq('entity_id', organizer.id)
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            entity_type: 'organizer',
            entity_id: organizer.id
          })
      }
      setIsFollowing(!isFollowing)
      fetchOrganizerStats()
    } catch (error) {
      console.error('Error following organizer:', error)
    } finally {
      setFollowLoading(false)
    }
  }


  const handleEventClick = (eventSlug: string) => {
    setSearchParams({ event: eventSlug })
  }

  const handleCloseEventModal = () => {
    setSearchParams({})
  }

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram size={20} />
      case 'twitter': return <Twitter size={20} />
      case 'facebook': return <Facebook size={20} />
      default: return <Globe size={20} />
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!organizer) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Organizer not found</h1>
            <button
              onClick={() => navigate('/organizers')}
              className="text-blue-600 hover:text-blue-700"
            >
              Back to Organizers
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const organizerJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organizer.name,
    description: organizer.bio || organizer.description || `${organizer.name} - Event organizer in the 785 area`,
    image: organizer.logo || organizer.image_url,
    url: organizer.website || `https://785mag.com/organizers/${organizer.slug}`,
    email: organizer.email,
    telephone: organizer.phone,
  }

  return (
    <Layout>
      <Helmet>
        <link rel="canonical" href={`https://785mag.com/organizers/${organizer.slug}/`} />
        <title>{organizer.name} | seveneightfive magazine</title>
        <meta name="description" content={organizer.bio || organizer.description || `Discover events organized by ${organizer.name}`} />
        <meta property="og:url" content={`https://785mag.com/organizers/${organizer.slug}/`} />
        <meta property="og:type" content="organization" />
        <meta property="og:title" content={organizer.name} />
        <meta property="og:description" content={organizer.description || `Discover events organized by ${organizer.name}`} />
        {organizer.logo && <meta property="og:image" content={organizer.logo} />}
        <script type="application/ld+json">
          {JSON.stringify(organizerJsonLd)}
        </script>
      </Helmet>
      <div className="min-h-screen bg-gray-50">

        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1)
                } else {
                  navigate('/organizers')
                }
              }}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 active:scale-95 transition-transform"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
              <span className="font-medium">Back</span>
            </button>
          </div>
        </div>

        <div className="hidden lg:block relative h-[60vh] overflow-hidden">
          {organizer.image_url ? (
            <img
              src={organizer.image_url}
              alt={organizer.name}
              className={`w-full h-full object-cover transition-all duration-1000 ${
                imageLoaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
              <Building2 size={120} className="text-white opacity-80" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-center mb-4">
                    <h1 className="text-6xl font-bold text-white drop-shadow-lg font-urbanist">
                      {organizer.name.toUpperCase()}
                    </h1>
                    {organizer.verified && (
                      <div className="ml-4 bg-blue-500 text-white px-3 py-2 rounded-full flex items-center">
                        <Star size={20} className="mr-2" />
                        <span className="font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                  {organizer.description && (
                    <p className="text-xl text-white/90 font-medium">{organizer.description}</p>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  {user && (
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`px-6 py-3 rounded-full backdrop-blur-sm transition-colors font-medium ${
                        isFollowing
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Heart size={20} fill={isFollowing ? 'currentColor' : 'none'} className="mr-2 inline" />
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Share2 size={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden aspect-[16/9] relative overflow-hidden mt-[52px]">
          {organizer.image_url ? (
            <img
              src={organizer.image_url}
              alt={organizer.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
              <Building2 size={64} className="text-white opacity-80" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center mb-2">
              <h1 className="text-2xl font-bold text-white font-urbanist">
                {organizer.name.toUpperCase()}
              </h1>
              {organizer.verified && (
                <Star size={16} className="ml-2 text-blue-400" />
              )}
            </div>
            {organizer.description && (
              <p className="text-white/90">{organizer.description}</p>
            )}

            {user && (
              <div className="mt-3">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-4 py-2 rounded-full backdrop-blur-sm transition-colors font-medium text-sm ${
                    isFollowing
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Heart size={16} fill={isFollowing ? 'currentColor' : 'none'} className="mr-2 inline" />
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center space-x-8 text-gray-600">
              <div className="flex items-center">
                <Heart size={20} className="mr-2 text-red-500" />
                <span className="font-semibold text-gray-900">{followersCount.toLocaleString()}</span>
                <span className="ml-1">followers</span>
              </div>
              <div className="flex items-center">
                <Eye size={20} className="mr-2 text-blue-500" />
                <span className="font-semibold text-gray-900">{pageViews.toLocaleString()}</span>
                <span className="ml-1">views</span>
              </div>
              <div className="flex items-center">
                <Calendar size={20} className="mr-2 text-green-500" />
                <span className="font-semibold text-gray-900">{totalEventsCount}</span>
                <span className="ml-1">total events</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <div className="hidden lg:block mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Organizers
            </button>
          </div>

          <div className="lg:hidden bg-white rounded-xl p-6 mb-8 shadow-sm">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{followersCount.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{pageViews.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Views</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalEventsCount}</div>
                <div className="text-sm text-gray-600">Events</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {organizer.bio && (
                <section className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {organizer.bio}
                    </p>
                  </div>
                </section>
              )}

              {events.length > 0 && (
                <section className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
                  <div className="space-y-4">
                    {events.map((event) => {
                      const eventDate = new Date(event.start_date)
                      const monthShort = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                      const dayNumber = eventDate.getDate()

                      return (
                        <button
                          key={event.id}
                          onClick={() => handleEventClick(event.slug || '')}
                          className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors group text-left"
                        >
                          <div className="bg-[#FFCE03] rounded-lg p-3 text-center flex-shrink-0 w-16">
                            <div className="text-xs font-medium text-black">{monthShort}</div>
                            <div className="text-xl font-bold text-black">{dayNumber}</div>
                          </div>

                          <div className="flex-1 min-w-0">
                            {event.venue?.name && (
                              <div className="flex items-center text-sm font-medium text-gray-600 mb-1">
                                <MapPin size={14} className="mr-1 flex-shrink-0" />
                                <span className="truncate">{event.venue.name}</span>
                              </div>
                            )}
                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                              {event.title}
                            </div>
                            {event.event_start_time && (
                              <div className="text-sm text-gray-500">
                                {event.event_start_time}
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-8">
              {(organizer.website || organizer.email || organizer.phone || (organizer.social_links && Object.keys(organizer.social_links).length > 0)) && (
                <section className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Contact</h2>
                  <div className="space-y-3">
                    {organizer.website && (
                      <a
                        href={organizer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Globe size={20} className="mr-3 text-gray-600" />
                        <span className="font-medium text-gray-900">Website</span>
                      </a>
                    )}

                    {organizer.email && (
                      <a
                        href={`mailto:${organizer.email}`}
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Mail size={20} className="mr-3 text-gray-600" />
                        <span className="font-medium text-gray-900">Email</span>
                      </a>
                    )}

                    {organizer.phone && (
                      <a
                        href={`tel:${organizer.phone}`}
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Phone size={20} className="mr-3 text-gray-600" />
                        <span className="font-medium text-gray-900">{organizer.phone}</span>
                      </a>
                    )}

                    {organizer.social_links && Object.entries(organizer.social_links).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="mr-3 text-gray-600">
                          {getSocialIcon(platform)}
                        </div>
                        <span className="font-medium text-gray-900 capitalize">{platform}</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        <EventModal
          eventSlug={eventSlugFromUrl}
          isOpen={isEventModalOpen}
          onClose={handleCloseEventModal}
        />

        {organizer && (
          <ShareModal
            isOpen={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            title={organizer.name}
            description={organizer.description}
            url={window.location.href}
            imageUrl={organizer.logo_url || organizer.image_url}
          />
        )}
      </div>
    </Layout>
  )
}

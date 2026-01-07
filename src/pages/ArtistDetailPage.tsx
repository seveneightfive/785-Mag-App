import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Music, Globe, Heart, Share2, ArrowLeft, Star, Calendar, MapPin, Play, Users, Palette, Eye, Instagram, Twitter, Facebook, Youtube, Mail } from 'lucide-react'
import { Layout } from '../components/Layout'
import { ReviewSection } from '../components/ReviewSection'
import { EventModal } from '../components/EventModal'
import { ShareModal } from '../components/ShareModal'
import { ArtistGallery } from '../components/ArtistGallery'
import { AudioPlayer } from '../components/AudioPlayer'
import { VideoPlayer } from '../components/VideoPlayer'
import { WorksGallery } from '../components/WorksGallery'
import { useAuth } from '../hooks/useAuth'
import { supabase, type Artist, type Event, type Work, trackPageView } from '../lib/supabase'

export const ArtistDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [artist, setArtist] = useState<Artist | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [works, setWorks] = useState<Work[]>([])
  const [collectedWorks, setCollectedWorks] = useState<Work[]>([])
  const [collectorsCount, setCollectorsCount] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)
  const [pageViews, setPageViews] = useState(0)
  const [loading, setLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [showAudioPlayer, setShowAudioPlayer] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)

  const eventSlugFromUrl = searchParams.get('event')
  const isEventModalOpen = !!eventSlugFromUrl

  useEffect(() => {
    if (slug) {
      fetchArtist()
      fetchArtistEvents()
    }
  }, [slug])

  useEffect(() => {
    if (artist) {
      fetchArtistWorks()
      fetchArtistStats()
    }
  }, [artist])

  useEffect(() => {
    if (artist && user) {
      checkFollowStatus()
    }
  }, [artist, user])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchArtist = async () => {
    if (!slug) return

    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      console.error('Error fetching artist:', error)
      navigate('/artists')
      return
    }

    setArtist(data)
    trackPageView('artist', data.id)
    setLoading(false)
  }

  const fetchArtistEvents = async () => {
    if (!slug) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('events')
      .select(`
        *,
        venue:venues(*),
        event_artists!inner(artist:artists!inner(slug))
      `)
      .eq('event_artists.artist.slug', slug)
      .gte('start_date', today.toISOString())
      .order('start_date', { ascending: true })

    if (data) {
      setEvents(data)
    }
  }

  const fetchArtistWorks = async () => {
    if (!artist) return

    const { data } = await supabase
      .from('works')
      .select('*')
      .eq('artist_id', artist.id)
      .order('created_at', { ascending: false })

    if (data) {
      setWorks(data)

      const { data: collected } = await supabase
        .from('work_collectors')
        .select('work_id')
        .eq('artist_id', artist.id)
        .in('work_id', data.map((w) => w.id))

      if (collected) {
        setCollectedWorks(data.filter((w) => collected.some((c) => c.work_id === w.id)))
      }
    }
  }

  const fetchArtistStats = async () => {
    if (!artist) return

    const { data: followers } = await supabase
      .from('follows')
      .select('id')
      .eq('following_id', artist.id)
      .eq('following_type', 'artist')

    if (followers) {
      setFollowersCount(followers.length)
    }

    const { data: views } = await supabase
      .from('page_views')
      .select('id')
      .eq('entity_id', artist.id)
      .eq('entity_type', 'artist')

    if (views) {
      setPageViews(views.length)
    }
  }

  const checkFollowStatus = async () => {
    if (!artist || !user) return

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', artist.id)
      .eq('following_type', 'artist')
      .maybeSingle()

    setIsFollowing(!!data)
  }

  const handleFollow = async () => {
    if (!user || !artist) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', artist.id)
          .eq('following_type', 'artist')

        if (!error) {
          setIsFollowing(false)
          setFollowersCount(Math.max(0, followersCount - 1))
        }
      } else {
        const { error } = await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: artist.id,
          following_type: 'artist',
        })

        if (!error) {
          setIsFollowing(true)
          setFollowersCount(followersCount + 1)
        }
      }
    } finally {
      setFollowLoading(false)
    }
  }

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram size={20} />
      case 'twitter': return <Twitter size={20} />
      case 'facebook': return <Facebook size={20} />
      case 'youtube': return <Youtube size={20} />
      case 'spotify': return null
      case 'email': return <Mail size={20} />
      default: return <Globe size={20} />
    }
  }

  const handleEventClick = (eventSlug: string) => {
    setSearchParams({ event: eventSlug })
  }

  const handleCloseEventModal = () => {
    setSearchParams({})
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    )
  }

  if (!artist) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Artist not found</h1>
            <button
              onClick={() => navigate('/artists')}
              className="text-yellow-400 hover:text-yellow-500"
            >
              Back to Artists
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const galleryImages = artist.social_media || []
  const heroImage = artist.avatar_url || artist.image_url

  const artistJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artist.name,
    description: artist.bio || `Discover ${artist.name}`,
    image: heroImage,
    url: `https://785mag.com/artists/${artist.slug}`,
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">

        {/* Desktop 3-Column Hero */}
        <div className="hidden lg:grid lg:grid-cols-3 relative h-[60vh] overflow-hidden">
          {/* Left Column - Image */}
          <div className="relative overflow-hidden">
            {artist.image_url ? (
              <img
                src={artist.image_url}
                alt={artist.name}
                className={`w-full h-full object-cover transition-all duration-1000 ${
                  imageLoaded ? 'hero-ken-burns-left' : 'scale-110 opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Music size={80} className="text-white opacity-80" />
              </div>
            )}
          </div>

          {/* Middle Column - Text Section */}
          <div className="bg-black flex flex-col items-center justify-center p-8 relative">
            <div className="text-center">
              {artist.tagline && (
                <p className={`text-xl text-white mb-6 transition-all duration-1000 ${
                  imageLoaded ? 'hero-fade-in-text opacity-100' : 'opacity-0'
                }`}>
                  {artist.tagline}
                </p>
              )}
              <h1 className={`text-6xl font-oswald font-light text-white tracking-tight transition-all duration-1000 ${
                imageLoaded ? 'hero-fade-in-text opacity-100' : 'opacity-0'
              }`}>
                {artist.name.toUpperCase()}
              </h1>
            </div>
          </div>

          {/* Right Column - Avatar */}
          <div className="relative overflow-hidden">
            {artist.avatar_url ? (
              <img
                src={artist.avatar_url}
                alt={artist.name}
                className={`w-full h-full object-cover transition-all duration-1000 ${
                  imageLoaded ? 'hero-ken-burns-right' : 'scale-110 opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                <Music size={80} className="text-white opacity-80" />
              </div>
            )}
          </div>
        </div>

        {/* Mobile Hero - Stacked Vertical */}
        <div className="lg:hidden flex flex-col">
          {/* Mobile Left Image */}
          <div className="aspect-square overflow-hidden">
            {artist.image_url ? (
              <img
                src={artist.image_url}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Music size={48} className="text-white opacity-80" />
              </div>
            )}
          </div>

          {/* Mobile Middle Text Section */}
          <div className="bg-black text-white p-6 flex flex-col items-center justify-center min-h-[200px]">
            {artist.tagline && (
              <p className="text-center text-base mb-4">{artist.tagline}</p>
            )}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <h1 className="text-3xl font-oswald font-light uppercase tracking-tight">
                {artist.name.toUpperCase()}
              </h1>
              {artist.verified && (
                <div className="bg-blue-500 text-white px-2 py-1 rounded-full flex items-center flex-shrink-0">
                  <Star size={14} className="mr-1" />
                  <span className="text-xs font-medium">Verified</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right Image */}
          <div className="aspect-square overflow-hidden">
            {artist.avatar_url ? (
              <img
                src={artist.avatar_url}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                <Music size={48} className="text-white opacity-80" />
              </div>
            )}
          </div>

        {/* Stats Section - Desktop */}
        <div className="hidden lg:block bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between text-gray-600">
              <div className="flex items-center space-x-8">
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
                {collectorsCount > 0 && (
                  <div className="flex items-center">
                    <Users size={20} className="mr-2 text-purple-500" />
                    <span className="font-semibold text-gray-900">{collectorsCount}</span>
                    <span className="ml-1">collectors</span>
                  </div>
                )}
              </div>

              {/* Actions and Verified */}
              <div className="flex items-center space-x-4">
                {artist.verified && (
                  <div className="bg-blue-500 text-white px-3 py-2 rounded-full flex items-center">
                    <Star size={16} className="mr-2" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                )}
                <button
                  onClick={handleShare}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  title="Share"
                >
                  <Share2 size={20} />
                </button>
                {user && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`transition-colors ${
                      isFollowing
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title={isFollowing ? 'Unfollow' : 'Follow'}
                  >
                    <Heart size={20} fill={isFollowing ? 'currentColor' : 'none'} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* About Section - White Card Over Image */}
        <div className="relative z-20 -mt-24 lg:-mt-32 px-4 lg:px-0 pb-12 lg:pb-24">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 lg:p-12">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6 mb-8 pb-8 border-b border-gray-200">
              <div>
                <div className="text-3xl font-bold text-gray-900">{followersCount.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{works.length}</div>
                <div className="text-sm text-gray-600">Works</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{pageViews.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Views</div>
              </div>
            </div>
          </div>

          {/* About Section - Full Width */}
          {artist.bio && (
            <section className="bg-white mb-8">
              <div className="px-4 lg:px-12 py-12">
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-lg">
                  {artist.bio}
                </p>
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">

            {/* About */}
            {artist.bio && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {artist.bio}
                </p>
              </div>
            )}

              {/* Video Section */}
              {artist.video_url && artist.video_title && (
                <section className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Video</h2>
                  <VideoPlayer videoUrl={artist.video_url} title={artist.video_title} description={artist.artistvideoabout} />
                </section>
              )}
            </div>

        {/* Gallery Section */}
        {galleryImages.length > 0 && (
          <div className="relative z-10 max-w-5xl mx-auto px-4 lg:px-0 py-16 lg:py-24">
            <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-8 lg:mb-12">Gallery</h2>
            <ArtistGallery images={galleryImages} />
          </div>
        )}

        {/* Works Section */}
        {works.length > 0 && (
          <div className="relative z-10 max-w-5xl mx-auto px-4 lg:px-0 py-12 lg:py-24">
            <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-8">Works</h2>
            <WorksGallery
              works={works}
              onWorkClick={() => {}}
            />
          </div>
        )}

        {/* Events Section */}
        {events.length > 0 && (
          <div className="relative z-10 max-w-5xl mx-auto px-4 lg:px-0 py-12 lg:py-24">
            <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-8">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event.slug)}
                  className="text-left bg-gray-50 hover:bg-gray-100 rounded-xl p-6 transition-colors"
                >
                  <div className="text-sm font-semibold text-yellow-600 mb-2">
                    {new Date(event.start_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
                  {event.venue && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <MapPin size={16} />
                      {event.venue.name}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Audio Player */}
        {showAudioPlayer && artist.audio_file_url && artist.audio_title && (
          <AudioPlayer
            audioUrl={artist.audio_file_url}
            title={artist.audio_title}
            artistName={artist.name}
            purchaseLink={artist.purchase_link}
            onClose={() => setShowAudioPlayer(false)}
          />
        )}

        {/* Hero Animations */}
        <style>{`
          @keyframes kenBurnsLeft {
            from {
              opacity: 0;
              transform: scale(1.1) translateX(0);
            }
            to {
              opacity: 1;
              transform: scale(1) translateX(-5px);
            }
          }

          @keyframes kenBurnsRight {
            from {
              opacity: 0;
              transform: scale(1.1) translateX(0);
            }
            to {
              opacity: 1;
              transform: scale(1) translateX(5px);
            }
          }

          @keyframes fadeInText {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .hero-ken-burns-left {
            animation: kenBurnsLeft 3s ease-out forwards;
          }

          .hero-ken-burns-right {
            animation: kenBurnsRight 3s ease-out forwards;
          }

          .hero-fade-in-text {
            animation: fadeInText 1s ease-out forwards;
            animation-delay: 0.5s;
          }
        `}</style>
      </div>

      {/* Modals */}
      <EventModal
        eventSlug={eventSlugFromUrl}
        isOpen={isEventModalOpen}
        onClose={handleCloseEventModal}
      />

      {artist && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          title={artist.name}
          description={artist.bio}
          url={window.location.href}
          imageUrl={heroImage}
        />
      )}
    </Layout>
  )
}

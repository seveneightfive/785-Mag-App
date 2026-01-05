import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Heart, Share2, ArrowLeft, Star, Calendar, MapPin, Play, Users, Palette, Eye, Instagram, Twitter, Facebook, Youtube, Mail, Globe, ChevronDown } from 'lucide-react'
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
      <Helmet>
        <link rel="canonical" href={`https://785mag.com/artists/${artist.slug}/`} />
        <title>{artist.name} | seveneightfive magazine</title>
        <meta name="description" content={artist.bio || `Discover ${artist.name}`} />
        <meta property="og:url" content={`https://785mag.com/artists/${artist.slug}/`} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={artist.name} />
        <meta property="og:description" content={artist.bio || `Discover ${artist.name}`} />
        {heroImage && <meta property="og:image" content={heroImage} />}
        <script type="application/ld+json">
          {JSON.stringify(artistJsonLd)}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-white">
        {/* Hero Section with Image and Name */}
        <div
          ref={heroRef}
          className="relative h-screen overflow-hidden bg-gray-900"
        >
          {/* Background Image with Ken Burns Effect */}
          {heroImage && (
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out"
                style={{
                  backgroundImage: `url('${heroImage}')`,
                  transform: `scale(${1 + scrollY * 0.0003})`,
                }}
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          )}

          {/* Fixed Header Controls */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 lg:p-6">
            <button
              onClick={() => navigate('/artists')}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-white"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShareModalOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-white"
                aria-label="Share artist"
              >
                <Share2 size={20} />
              </button>
              {user && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center justify-center px-4 py-2 rounded-full backdrop-blur-sm transition-all ${
                    isFollowing
                      ? 'bg-yellow-400/90 text-gray-900 hover:bg-yellow-400'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Heart size={18} fill={isFollowing ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>
          </div>

          {/* Name Overlay */}
          <div className="absolute inset-0 flex items-end justify-start p-6 lg:p-12">
            <div className="max-w-2xl z-10">
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight mb-4">
                {artist.name}
              </h1>
              {artist.genre && (
                <p className="text-lg lg:text-xl text-white/90">
                  {artist.genre}
                </p>
              )}
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
            <ChevronDown className="text-white" size={32} />
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

            {/* About */}
            {artist.bio && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {artist.bio}
                </p>
              </div>
            )}

            {/* Type Badge */}
            {artist.artist_type && (
              <div className="inline-block bg-yellow-100 text-yellow-900 px-4 py-2 rounded-full text-sm font-medium">
                {artist.artist_type}
              </div>
            )}
          </div>
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

        {/* Reviews Section */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 lg:px-0 py-12 lg:py-24">
          <ReviewSection entityType="artist" entityId={artist.id} />
        </div>

        {/* Social Links at Bottom */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 lg:px-0 py-12 lg:py-24 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Connect</h3>
          <div className="flex gap-4 flex-wrap">
            {artist.instagram_url && (
              <a
                href={artist.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors"
                title="Instagram"
              >
                {getSocialIcon('instagram')}
              </a>
            )}
            {artist.twitter_url && (
              <a
                href={artist.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors"
                title="Twitter"
              >
                {getSocialIcon('twitter')}
              </a>
            )}
            {artist.facebook_url && (
              <a
                href={artist.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors"
                title="Facebook"
              >
                {getSocialIcon('facebook')}
              </a>
            )}
            {artist.youtube_url && (
              <a
                href={artist.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors"
                title="YouTube"
              >
                {getSocialIcon('youtube')}
              </a>
            )}
            {artist.website_url && (
              <a
                href={artist.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors"
                title="Website"
              >
                {getSocialIcon('website')}
              </a>
            )}
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className="relative z-10 h-12" />
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

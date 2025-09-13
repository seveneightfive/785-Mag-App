import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Music, Globe, Heart, Share2, ArrowLeft, Star, Calendar, MapPin, Play, Users, Palette, Eye, Instagram, Twitter, Facebook, Youtube, Mail } from 'lucide-react'
import { Layout } from '../components/Layout'
import { ReviewSection } from '../components/ReviewSection'
import { EventCard } from '../components/EventCard'
import { AudioPlayer } from '../components/AudioPlayer'
import { VideoPlayer } from '../components/VideoPlayer'
import { WorksGallery } from '../components/WorksGallery'
import { useAuth } from '../hooks/useAuth'
import { supabase, type Artist, type Event, type Work, trackPageView } from '../lib/supabase'

export const ArtistDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
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

  const fetchArtist = async () => {
    if (!slug) return

    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('slug', slug)
      .single()

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

    const { data } = await supabase
      .from('events')
      .select(`
        *,
        venue:venues(*),
        event_artists!inner(artist:artists!inner(slug))
      `)
      .eq('event_artists.artist.slug', slug)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })

    if (data) {
      setEvents(data)
    }
  }

  const fetchArtistWorks = async () => {
    if (!artist) return

    // Fetch artist's works
    const { data: artistWorksData } = await supabase
      .from('works')
      .select('*')
      .eq('artist_id', artist.id)
      .order('created_at', { ascending: false })

    if (artistWorksData) {
      setWorks(artistWorksData)
    }

    // Fetch works in collections
    const { data: collectedWorksData } = await supabase
      .from('works')
      .select('*')
      .eq('artist_id', artist.id)
      .eq('is_in_collection', true)
      .order('created_at', { ascending: false })

    if (collectedWorksData) {
      setCollectedWorks(collectedWorksData)
      
      // Count unique collectors
      const uniqueCollectors = new Set(collectedWorksData.map(work => work.user_id))
      setCollectorsCount(uniqueCollectors.size)
    }
  }

  const fetchArtistStats = async () => {
    if (!artist) return

    // Get followers count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', 'artist')
      .eq('entity_id', artist.id)

    setFollowersCount(followersCount || 0)

    // Get page views count
    const { count: viewsCount } = await supabase
      .from('page_views')
      .select('id', { count: 'exact', head: true })
      .eq('page_type', 'artist')
      .eq('page_id', artist.id)

    setPageViews(viewsCount || 0)
  }

  const checkFollowStatus = async () => {
    if (!artist || !user) return

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('entity_type', 'artist')
      .eq('entity_id', artist.id)
      .single()

    setIsFollowing(!!data)
  }

  const handleFollow = async () => {
    if (!user || !artist) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('entity_type', 'artist')
          .eq('entity_id', artist.id)
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            entity_type: 'artist',
            entity_id: artist.id
          })
      }
      setIsFollowing(!isFollowing)
      fetchArtistStats() // Refresh stats
    } catch (error) {
      console.error('Error following artist:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: artist?.name,
          text: artist?.bio,
          url: window.location.href
        })
      } catch (error) {
        // Only log non-user-cancellation errors
        if (error.name !== 'NotAllowedError') {
          console.error('Error sharing:', error)
        }
        // Fallback to clipboard copy on any error
        navigator.clipboard.writeText(window.location.href)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram size={20} />
      case 'twitter': return <Twitter size={20} />
      case 'facebook': return <Facebook size={20} />
      case 'youtube': return <Youtube size={20} />
      case 'spotify': return <Music size={20} />
      case 'email': return <Mail size={20} />
      default: return <Globe size={20} />
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
              className="text-purple-600 hover:text-purple-700"
            >
              Back to Artists
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
          {artist.avatar_url || artist.image_url ? (
            <img
              src={artist.avatar_url || artist.image_url}
              alt={artist.name}
              className={`w-full h-full object-cover transition-all duration-1000 ${
                imageLoaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Music size={120} className="text-white opacity-80" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          
          {/* Artist Name - Reverse Type */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-center mb-4">
                    <h1 className="text-6xl font-bold text-white drop-shadow-lg">
                      {artist.name}
                    </h1>
                    {artist.verified && (
                      <div className="ml-4 bg-blue-500 text-white px-3 py-2 rounded-full flex items-center">
                        <Star size={20} className="mr-2" />
                        <span className="font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                  {artist.tagline && (
                    <p className="text-xl text-white/90 font-medium italic">{artist.tagline}</p>
                  )}
                  {!artist.tagline && artist.genre && (
                    <p className="text-xl text-white/90 font-medium">{artist.genre}</p>
                  )}
                </div>
                
                {/* Actions */}
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
                    onClick={handleShare}
                    className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Share2 size={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Hero */}
        <div className="lg:hidden aspect-[16/9] relative overflow-hidden">
          {artist.avatar_url || artist.image_url ? (
            <img
              src={artist.avatar_url || artist.image_url}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Music size={64} className="text-white opacity-80" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center mb-2">
              <h1 className="text-2xl font-bold text-white">
                {artist.name}
              </h1>
              {artist.verified && (
                <Star size={16} className="ml-2 text-blue-400" />
              )}
            </div>
            {artist.tagline && (
              <p className="text-white/90 italic">{artist.tagline}</p>
            )}
            {!artist.tagline && artist.genre && (
              <p className="text-white/90">{artist.genre}</p>
            )}
            
            {/* Mobile Follow Button */}
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

        {/* Stats Section - Desktop */}
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
              {collectorsCount > 0 && (
                <div className="flex items-center">
                  <Users size={20} className="mr-2 text-purple-500" />
                  <span className="font-semibold text-gray-900">{collectorsCount}</span>
                  <span className="ml-1">collectors</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          {/* Desktop Back Button */}
          <div className="hidden lg:block mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Artists
            </button>
          </div>

          {/* Mobile Stats */}
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
              {collectorsCount > 0 && (
                <div>
                  <div className="text-2xl font-bold text-gray-900">{collectorsCount}</div>
                  <div className="text-sm text-gray-600">Collectors</div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              {artist.bio && (
                <section className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {artist.bio}
                    </p>
                  </div>
                </section>
              )}

              {/* Audio Player Section - Musicians only */}
              {/* Upcoming Events */}
              {events.length > 0 && (
                <section className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
                  <div className="space-y-4">
                    {events.map((event) => {
                      const eventDate = new Date(event.start_date)
                      const monthShort = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                      const dayNumber = eventDate.getDate()
                      
                      return (
                        <Link
                          key={event.id}
                          to={`/events/${event.slug}`}
                          className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors group"
                        >
                          {/* Date Box */}
                          <div className="bg-[#FFCE03] rounded-lg p-3 text-center flex-shrink-0 w-16">
                            <div className="text-xs font-medium text-black">{monthShort}</div>
                            <div className="text-xl font-bold text-black">{dayNumber}</div>
                          </div>
                          
                          {/* Event Details */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-600 mb-1">
                              {event.venue?.name}
                            </div>
                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                              {event.title}
                            </div>
                            {event.event_start_time && (
                              <div className="text-sm text-gray-500">
                                {event.event_start_time}
                              </div>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Works Gallery */}
              {works.length > 0 && (
                <section className="bg-white rounded-xl p-6 shadow-sm">
                  <WorksGallery 
                    works={works.filter(work => !work.is_in_collection)} 
                    title="Available Works" 
                  />
                </section>
              )}

              {/* Collections Section */}
              {collectedWorks.length > 0 && (
                <section className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">In Collections</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users size={16} className="mr-1" />
                        <span>{collectorsCount} collector{collectorsCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center">
                        <Palette size={16} className="mr-1" />
                        <span>{collectedWorks.length} work{collectedWorks.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <WorksGallery 
                    works={collectedWorks} 
                    title="" 
                    showCollector={true}
                  />
                </section>
              )}

              {/* Video Section */}
              {artist.video_url && artist.video_title && (
                <section className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Video</h2>
                  <VideoPlayer videoUrl={artist.video_url} title={artist.video_title} />
                </section>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Contact Information */}
              {(artist.artist_website || artist.website || artist.social_facebook || artist.artist_spotify || artist.artist_youtube || artist.artist_email || (artist.social_links && Object.keys(artist.social_links).length > 0)) && (
                <section className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Connect</h2>
                  <div className="space-y-3">
                    {(artist.artist_website || artist.website) && (
                      <a
                        href={artist.artist_website || artist.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Globe size={20} className="mr-3 text-gray-600" />
                        <span className="font-medium text-gray-900">Website</span>
                      </a>
                    )}
                    
                    {artist.artist_email && (
                      <a
                        href={`mailto:${artist.artist_email}`}
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Mail size={20} className="mr-3 text-gray-600" />
                        <span className="font-medium text-gray-900">Email</span>
                      </a>
                    )}

                    {artist.social_facebook && (
                      <a
                        href={artist.social_facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Facebook size={20} className="mr-3 text-gray-600" />
                        <span className="font-medium text-gray-900">Facebook</span>
                      </a>
                    )}

                    {artist.artist_spotify && (
                      <a
                        href={artist.artist_spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Music size={20} className="mr-3 text-gray-600" />
                        <span className="font-medium text-gray-900">Spotify</span>
                      </a>
                    )}

                    {artist.artist_youtube && (
                      <a
                        href={artist.artist_youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Youtube size={20} className="mr-3 text-gray-600" />
                        <span className="font-medium text-gray-900">YouTube</span>
                      </a>
                    )}

                    {artist.social_links && Object.entries(artist.social_links).map(([platform, url]) => (
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

          {/* Reviews Section */}
          <div className="mt-8">
            <ReviewSection entityType="artist" entityId={artist.id} createdBy={artist.created_by} />
          </div>
        </div>

        {/* Sticky Featured Track - Musicians only */}
        {artist.artist_type === 'Musician' && artist.audio_file_url && artist.audio_title && (
          <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg z-40 lg:left-64">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{artist.audio_title}</h3>
                  <p className="text-white/80 text-sm">by {artist.name}</p>
                </div>
                <button
                  onClick={() => setShowAudioPlayer(true)}
                  className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors shadow-lg ml-4 flex-shrink-0"
                >
                  <Play size={20} />
                </button>
              </div>
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
      </div>
    </Layout>
  )
}
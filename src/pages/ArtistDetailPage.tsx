import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Share2, ArrowLeft } from 'lucide-react'
import { Layout } from '../components/Layout'
import { ReviewSection } from '../components/ReviewSection'
import { EventModal } from '../components/EventModal'
import { ShareModal } from '../components/ShareModal'
import { ArtistProfileSidebar } from '../components/ArtistProfileSidebar'
import { ArtistPortfolioTab } from '../components/ArtistPortfolioTab'
import { ArtistAboutTab } from '../components/ArtistAboutTab'
import { ArtistEventsTab } from '../components/ArtistEventsTab'
import { ArtistCollectionsTab } from '../components/ArtistCollectionsTab'
import { useAuth } from '../hooks/useAuth'
import { supabase, type Artist, type Event, type Work, type Announcement, trackPageView } from '../lib/supabase'

export const ArtistDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [artist, setArtist] = useState<Artist | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [works, setWorks] = useState<Work[]>([])
  const [collectedWorks, setCollectedWorks] = useState<Work[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('about')
  const [artistJsonLd, setArtistJsonLd] = useState<any>(null)

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
    }
  }, [artist])

  useEffect(() => {
    if (artist) {
      fetchArtistAnnouncements()
    }
  }, [artist])

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

    // Fetch JSON-LD from the view
    const { data: jsonLdData } = await supabase
      .from('artists_jsonld')
      .select('jsonld')
      .eq('slug', slug)
      .maybeSingle()

    if (jsonLdData) {
      setArtistJsonLd(jsonLdData.jsonld)
    }

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

  const fetchArtistAnnouncements = async () => {
    if (!artist) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('entity_type', 'artist')
      .eq('entity_id', artist.id)
      .eq('active', true)
      .or(`expires_at.is.null,expires_at.gte.${today.toISOString()}`)
      .order('created_at', { ascending: false })

    if (data) {
      setAnnouncements(data)
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

  const heroImage = artist.avatar_url || artist.image_url

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return <ArtistAboutTab artist={artist} works={works} />
      case 'events':
        return (
          <ArtistEventsTab
            events={events}
            announcements={announcements}
            onEventClick={handleEventClick}
          />
        )
      case 'portfolio':
        return <ArtistPortfolioTab artist={artist} works={works} />
      case 'collections':
        return <ArtistCollectionsTab collectedWorks={collectedWorks} />
      default:
        return <ArtistAboutTab artist={artist} works={works} />
    }
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
        {artistJsonLd && (
          <script type="application/ld+json">
            {JSON.stringify(artistJsonLd)}
          </script>
        )}
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header with Back and Share */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate('/artists')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back to Artists</span>
            </button>

            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Share artist"
            >
              <Share2 size={20} />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Left Sidebar */}
            <ArtistProfileSidebar
              artist={artist}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Right Main Content */}
            <div className="flex-1 bg-white rounded-lg p-6 lg:p-8 shadow-sm min-h-[600px]">
              {renderTabContent()}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
          <ReviewSection entityType="artist" entityId={artist.id} />
        </div>
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
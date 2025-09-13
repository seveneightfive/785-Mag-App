import React, { useState, useEffect } from 'react'
import { Calendar, Music, MapPin, Camera, MessageCircle, Star } from 'lucide-react'
import { Layout } from '../components/Layout'
import { MenuProcCard } from '../components/MenuProcCard'
import { MenuProcModal } from '../components/MenuProcModal'
import { MenuProcForm } from '../components/MenuProcForm'
import { supabase, type MenuProc, type Review, trackPageView } from '../lib/supabase'

interface FeedItem {
  id: string
  type: 'menu_proc' | 'review'
  created_at: string
  data: MenuProc | (Review & { entity_name?: string, entity_type?: string })
}

export const FeedPage: React.FC = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMenuProc, setSelectedMenuProc] = useState<MenuProc | null>(null)
  const [showMenuProcModal, setShowMenuProcModal] = useState(false)
  const [showMenuProcForm, setShowMenuProcForm] = useState(false)

  useEffect(() => {
    trackPageView('feed')
    fetchFeedItems()
  }, [])

  const fetchFeedItems = async () => {
    try {
      // Fetch menu procs
      const { data: menuProcs } = await supabase
        .from('menu_procs')
        .select(`
          *,
          venues!menu_procs_venue_id_fkey(*),
          profiles!menu_procs_user_id_fkey(username, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch recent reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select(`
          *,
          profile:profiles(username, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      // Combine and sort by date
      const items: FeedItem[] = []

      if (menuProcs) {
        menuProcs.forEach(proc => {
          items.push({
            id: proc.id,
            type: 'menu_proc',
            created_at: proc.created_at || '',
            data: proc
          })
        })
      }

      if (reviews) {
        reviews.forEach(review => {
          items.push({
            id: review.id,
            type: 'review',
            created_at: review.created_at || '',
            data: {
              ...review,
              entity_name: 'Unknown', // We'd need to fetch this based on entity_type and entity_id
              entity_type: review.entity_type
            }
          })
        })
      }

      // Sort by date
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setFeedItems(items.slice(0, 20)) // Show latest 20 items
    } catch (error) {
      console.error('Error fetching feed items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMenuProcClick = (menuProc: MenuProc) => {
    setSelectedMenuProc(menuProc)
    setShowMenuProcModal(true)
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'event': return <Calendar size={16} />
      case 'artist': return <Music size={16} />
      case 'venue': return <MapPin size={16} />
      default: return <MessageCircle size={16} />
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold font-oswald text-gray-900">FEED</h1>
                <p className="text-gray-600 mt-2 max-w-2xl">
                  seveneightfive magazine is your guide to experiencing and appreciating the local flavor of Topeka. 
                  We showcase diverse culinary offerings and the businesses that make up Topeka's vibrant food scene.
                </p>
              </div>
              <button
                onClick={() => setShowMenuProcForm(true)}
                className="btn-yellow flex items-center space-x-2"
              >
                <Camera size={16} />
                <span>Create Menu Proc</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feed Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {feedItems.length === 0 ? (
            <div className="text-center py-12">
              <Camera size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No feed items yet</h3>
              <p className="text-gray-600 mb-6">Be the first to share a Menu Proc or review!</p>
              <button
                onClick={() => setShowMenuProcForm(true)}
                className="btn-yellow"
              >
                Create Menu Proc
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {feedItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {item.type === 'menu_proc' ? (
                    <div className="p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <Camera size={16} className="text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">Menu Proc</span>
                      </div>
                      <MenuProcCard
                        menuProc={item.data as MenuProc}
                        onClick={() => handleMenuProcClick(item.data as MenuProc)}
                        showVenue={true}
                      />
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        {getEntityIcon((item.data as any).entity_type)}
                        <span className="text-sm font-medium text-gray-600">
                          Review • {(item.data as any).entity_type}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              className={star <= (item.data as any).rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                            />
                          ))}
                          <span className="text-sm text-gray-600">
                            by {(item.data as any).profile?.username || 'Anonymous'}
                          </span>
                        </div>
                        {(item.data as any).title && (
                          <h3 className="font-semibold text-gray-900">{(item.data as any).title}</h3>
                        )}
                        {(item.data as any).content && (
                          <p className="text-gray-600 line-clamp-3">{(item.data as any).content}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
          onSuccess={fetchFeedItems}
        />
      </div>
    </Layout>
  )
}
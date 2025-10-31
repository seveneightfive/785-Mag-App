import React, { useState, useEffect } from 'react'
import { Search, Building2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { OrganizerCard } from '../components/OrganizerCard'
import { supabase, type Organizer, trackPageView } from '../lib/supabase'
import { Helmet } from 'react-helmet-async'

export const OrganizersDirectoryPage: React.FC = () => {
  const [organizers, setOrganizers] = useState<Organizer[]>([])
  const [filteredOrganizers, setFilteredOrganizers] = useState<Organizer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'events' | 'newest'>('name')
  const [eventsCountMap, setEventsCountMap] = useState<Record<string, number>>({})

  useEffect(() => {
    trackPageView('organizers')
    fetchOrganizers()
  }, [])

  useEffect(() => {
    filterAndSortOrganizers()
  }, [organizers, searchQuery, sortBy, eventsCountMap])

  const fetchOrganizers = async () => {
    try {
      const { data: organizersData, error } = await supabase
        .from('organizers')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      if (organizersData) {
        setOrganizers(organizersData)

        const countsMap: Record<string, number> = {}
        for (const organizer of organizersData) {
          const { count } = await supabase
            .from('event_organizers')
            .select('events!inner(start_date)', { count: 'exact', head: true })
            .eq('organizer_id', organizer.id)
            .gte('events.start_date', new Date().toISOString())

          countsMap[organizer.id] = count || 0
        }
        setEventsCountMap(countsMap)
      }
    } catch (error) {
      console.error('Error fetching organizers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortOrganizers = () => {
    let filtered = [...organizers]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(organizer =>
        organizer.name.toLowerCase().includes(query) ||
        organizer.description?.toLowerCase().includes(query) ||
        organizer.bio?.toLowerCase().includes(query)
      )
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'events':
          return (eventsCountMap[b.id] || 0) - (eventsCountMap[a.id] || 0)
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        default:
          return 0
      }
    })

    setFilteredOrganizers(filtered)
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

  return (
    <Layout>
      <Helmet>
        <title>Organizers Directory | seveneightfive magazine</title>
        <meta name="description" content="Discover event organizers in the 785 area. Browse organizations hosting concerts, art shows, community events, and more." />
      </Helmet>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold font-urbanist text-gray-900 mb-4 uppercase">
              Organizers Directory
            </h1>
            <p className="text-gray-600">
              Discover the organizations bringing events to life in the 785
            </p>
          </div>

          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search organizers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'events' | 'newest')}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="name">A-Z</option>
                <option value="events">Most Events</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Showing {filteredOrganizers.length} of {organizers.length} organizers
            </div>
          </div>

          {filteredOrganizers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrganizers.map((organizer) => (
                <OrganizerCard key={organizer.id} organizer={organizer} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No organizers found</h2>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search terms' : 'Check back soon for new organizers'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

import React, { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { TabNavigation, TabType } from './TabNavigation'
import { EventCardHorizontal } from './EventCardHorizontal'
import { supabase, Event } from '../lib/supabase'
import { getToday, getTomorrow, getDayAfterTomorrow, getSevenDaysFromNow } from '../utils/dateUtils'

export const EventsTabSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('today')
  const [todayEvents, setTodayEvents] = useState<Event[]>([])
  const [tomorrowEvents, setTomorrowEvents] = useState<Event[]>([])
  const [thisWeekEvents, setThisWeekEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)

      const today = getToday()
      const tomorrow = getTomorrow()
      const dayAfterTomorrow = getDayAfterTomorrow()
      const sevenDaysFromNow = getSevenDaysFromNow()

      const { data: todayData } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          event_artists(artist:artists(*))
        `)
        .gte('start_date', today.toISOString())
        .lt('start_date', tomorrow.toISOString())
        .order('event_start_time', { ascending: true })

      const { data: tomorrowData } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          event_artists(artist:artists(*))
        `)
        .gte('start_date', tomorrow.toISOString())
        .lt('start_date', dayAfterTomorrow.toISOString())
        .order('event_start_time', { ascending: true })

      const { data: weekData } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          event_artists(artist:artists(*))
        `)
        .gte('start_date', today.toISOString())
        .lt('start_date', sevenDaysFromNow.toISOString())
        .order('start_date', { ascending: true })
        .order('event_start_time', { ascending: true })

      setTodayEvents(todayData || [])
      setTomorrowEvents(tomorrowData || [])
      setThisWeekEvents(weekData || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActiveEvents = (): Event[] => {
    switch (activeTab) {
      case 'today':
        return todayEvents
      case 'tomorrow':
        return tomorrowEvents
      case 'this-week':
        return thisWeekEvents
      default:
        return []
    }
  }

  const activeEvents = getActiveEvents()

  if (loading) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          TOPEKA EVENTS CALENDAR
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          presented by seveneightfive magazine in partnership with ArtsConnect
        </p>

        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          todayCount={todayEvents.length}
          tomorrowCount={tomorrowEvents.length}
          thisWeekCount={thisWeekEvents.length}
        />
      </div>

      <div className="mt-8">
        {activeEvents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No events scheduled for {activeTab === 'today' ? 'today' : activeTab === 'tomorrow' ? 'tomorrow' : 'this week'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {activeEvents.map((event) => (
                <EventCardHorizontal key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

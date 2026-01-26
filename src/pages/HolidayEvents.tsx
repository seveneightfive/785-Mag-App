import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Calendar } from 'lucide-react';

export default function HolidayEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHolidayEvents();
  }, []);

  async function fetchHolidayEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('event_type', 'holiday')
      .eq('status', 'approved')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching holiday events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 font-urbanist">Upcoming Holiday Events</h1>
        
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No upcoming holiday events found.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {event.image_url && (
                  <img 
                    src={event.image_url} 
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2">{event.title}</h2>
                  {event.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar size={16} className="mr-2" />
                    {new Date(event.start_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  
                    href={`/events/${event.slug}`}
                    className="btn-yellow w-full text-center block"
                  {event.slug && (
                    <a href={`/events/${event.slug}`} className="btn-yellow w-full text-center block">
                      View Details
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
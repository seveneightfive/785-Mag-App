import React, { useState, useEffect } from 'react'
import { Plus, Eye, TrendingUp, DollarSign, Calendar, ExternalLink } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase, type Advertisement } from '../lib/supabase'
import { AdvertisementForm } from './AdvertisementForm'

interface AdStats {
  impressions: number
  clicks: number
  ctr: number
}

export const AdManagementSection: React.FC = () => {
  const { user } = useAuth()
  const [ads, setAds] = useState<Advertisement[]>([])
  const [adStats, setAdStats] = useState<Record<string, AdStats>>({})
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserAds()
    }
  }, [user])

  const fetchUserAds = async () => {
    if (!user) return

    try {
      const { data: adsData, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setAds(adsData || [])

      if (adsData && adsData.length > 0) {
        const statsPromises = adsData.map(ad => fetchAdStats(ad.id))
        const statsResults = await Promise.all(statsPromises)

        const statsMap: Record<string, AdStats> = {}
        adsData.forEach((ad, index) => {
          statsMap[ad.id] = statsResults[index]
        })
        setAdStats(statsMap)
      }
    } catch (error) {
      console.error('Error fetching ads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAdStats = async (adId: string): Promise<AdStats> => {
    const { data: impressionsData } = await supabase
      .from('ad_impressions')
      .select('id', { count: 'exact', head: true })
      .eq('ad_id', adId)

    const { data: clicksData } = await supabase
      .from('ad_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('ad_id', adId)

    const impressions = impressionsData?.length || 0
    const clicks = clicksData?.length || 0
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0

    return { impressions, clicks, ctr }
  }

  const getStatusBadge = (ad: Advertisement) => {
    const today = new Date().toISOString().split('T')[0]
    const startDate = ad.start_date
    const endDate = ad.end_date

    if (ad.payment_status !== 'completed') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending Payment</span>
    }

    if (today < startDate) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Scheduled</span>
    }

    if (today >= startDate && today <= endDate) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
    }

    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Ended</span>
  }

  const getRemainingDays = (ad: Advertisement) => {
    const today = new Date()
    const endDate = new Date(ad.end_date)
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Advertisements</h2>
          <p className="text-gray-600">Manage your ad campaigns and track performance</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-[#FFCE03] hover:bg-[#E5B902] text-black px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Create New Ad</span>
        </button>
      </div>

      {ads.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <DollarSign size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No advertisements yet</h3>
          <p className="text-gray-600 mb-6">Create your first ad to start promoting your business</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#FFCE03] hover:bg-[#E5B902] text-black px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Create Your First Ad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ads.map((ad) => {
            const stats = adStats[ad.id] || { impressions: 0, clicks: 0, ctr: 0 }
            const remainingDays = getRemainingDays(ad)

            return (
              <div key={ad.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {ad.headline || ad.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {ad.ad_copy || ad.content}
                    </p>
                  </div>
                  {getStatusBadge(ad)}
                </div>

                {ad.ad_image_url && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={ad.ad_image_url}
                      alt={ad.headline || ad.title}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center space-x-1 text-gray-600 mb-1">
                      <Eye size={14} />
                      <span className="text-xs">Impressions</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{stats.impressions}</div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-1 text-gray-600 mb-1">
                      <TrendingUp size={14} />
                      <span className="text-xs">Clicks</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{stats.clicks}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">CTR</div>
                    <div className="text-xl font-bold text-gray-900">{stats.ctr.toFixed(2)}%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar size={14} />
                    <span>
                      {new Date(ad.start_date).toLocaleDateString()} - {new Date(ad.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  {remainingDays > 0 && ad.payment_status === 'completed' && (
                    <span className="text-green-600 font-medium">{remainingDays} days left</span>
                  )}
                </div>

                {ad.button_link && (
                  <a
                    href={ad.button_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <span>View Destination</span>
                    <ExternalLink size={14} />
                  </a>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Campaign Price: ${(ad.price / 100).toFixed(2)} • Duration: {ad.duration} days
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AdvertisementForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={fetchUserAds}
      />
    </div>
  )
}

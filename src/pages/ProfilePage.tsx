import React, { useState, useEffect } from 'react'
import { User, Mail, Globe, Edit3, Save, X, Camera } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { supabase, trackPageView } from '../lib/supabase'

export const ProfilePage: React.FC = () => {
  const { user, profile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    website: ''
  })

  useEffect(() => {
    trackPageView('profile')
    if (profile) {
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        website: profile.website || ''
      })
    }
  }, [profile])

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id)

      if (!error) {
        setIsEditing(false)
        // Refresh the page to get updated profile
        window.location.reload()
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        website: profile.website || ''
      })
    }
    setIsEditing(false)
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
            <p className="text-gray-600">You need to be signed in to view your profile.</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-black flex items-center space-x-2"
              >
                <Edit3 size={16} />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-yellow flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="btn-white flex items-center space-x-2"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-2">Manage your account information</p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-black flex items-center space-x-2"
              >
                <Edit3 size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-yellow flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="btn-white flex items-center space-x-2"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 lg:px-8 py-8 lg:py-12">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || profile.username}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User size={32} className="text-white" />
                    )}
                  </div>
                  {isEditing && (
                    <button className="absolute -bottom-2 -right-2 bg-white text-gray-600 p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                      <Camera size={16} />
                    </button>
                  )}
                </div>
                <div className="flex-1 text-white">
                  <h2 className="text-2xl lg:text-3xl font-bold">
                    {profile?.full_name || profile?.username || 'User'}
                  </h2>
                  <p className="text-white/80 mt-1">@{profile?.username}</p>
                  <div className="flex items-center mt-2 text-white/70">
                    <Mail size={16} className="mr-2" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.username || 'Not set'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.full_name || 'Not set'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      {isEditing ? (
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://your-website.com"
                        />
                      ) : (
                        <div className="flex items-center">
                          {profile?.website ? (
                            <a
                              href={profile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 flex items-center"
                            >
                              <Globe size={16} className="mr-2" />
                              {profile.website}
                            </a>
                          ) : (
                            <p className="text-gray-500">Not set</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {profile?.bio || 'No bio added yet.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Email:</span> {user.email}
                  </div>
                  <div>
                    <span className="font-medium">Member since:</span>{' '}
                    {new Date(profile?.created_at || user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
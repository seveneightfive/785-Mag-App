import React, { useState, useEffect } from 'react'
import { X, Upload, Plus, HelpCircle, Camera } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase, type Venue } from '../lib/supabase'

interface MenuProcFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  preselectedVenue?: Venue
}

export const MenuProcForm: React.FC<MenuProcFormProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  preselectedVenue 
}) => {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const [showVenueForm, setShowVenueForm] = useState(false)
  const [showWhatIsMenuProc, setShowWhatIsMenuProc] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    venue_id: preselectedVenue?.id || '',
    images: [] as string[]
  })
  const [newVenue, setNewVenue] = useState({
    name: ''
  })
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchRestaurantVenues()
    }
  }, [isOpen])

  useEffect(() => {
    if (preselectedVenue) {
      setFormData(prev => ({ ...prev, venue_id: preselectedVenue.id }))
    }
  }, [preselectedVenue])

  const fetchRestaurantVenues = async () => {
    const { data } = await supabase
      .from('venues')
      .select('*')
      .in('venue_type', ['Restaurant', 'Bar/Tavern'])
      .order('name')

    if (data) {
      setVenues(data)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (formData.images.length >= 3) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, result]
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleCreateVenue = async () => {
    if (!newVenue.name.trim()) return

    const { data, error } = await supabase
      .from('venues')
      .insert({
        name: newVenue.name,
        address: 'TBD',
        city: 'Topeka',
        state: 'Kansas',
        venue_type: 'Restaurant',
        created_by: user?.id
      })
      .select()
      .single()

    if (!error && data) {
      setVenues(prev => [...prev, data])
      setFormData(prev => ({ ...prev, venue_id: data.id }))
      setNewVenue({ name: '' })
      setShowVenueForm(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Create menu proc
      const { error } = await supabase
        .from('menu_procs')
        .insert({
          title: formData.title,
          content: formData.content,
          images: formData.images,
          venue_id: formData.venue_id,
          user_id: user.id
        })

      if (!error) {
        // Award 5 points to user
        await supabase
          .from('profiles')
          .update({ 
            points: (profile?.points || 0) + 5 
          })
          .eq('id', user.id)

        // Reset form
        setFormData({
          title: '',
          content: '',
          venue_id: preselectedVenue?.id || '',
          images: []
        })
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error creating menu proc:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Menu Proc</h2>
                <button
                  onClick={() => setShowWhatIsMenuProc(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <HelpCircle size={14} />
                  <span>What is a Menu Proc?</span>
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {!user ? (
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign in to create a Menu Proc</h3>
                <p className="text-gray-600">You need to be signed in to share your favorite dishes.</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={guestInfo.firstName}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={guestInfo.lastName}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors">
                  Continue as Guest
                </button>
                <div className="text-center">
                  <span className="text-gray-500">or</span>
                </div>
                <button className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                  Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dish Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Truffle Mac & Cheese"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant/Bar *
                </label>
                {!showVenueForm ? (
                  <div className="space-y-2">
                    <select
                      value={formData.venue_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, venue_id: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    >
                      <option value="">Select a restaurant or bar</option>
                      {venues.map(venue => (
                        <option key={venue.id} value={venue.id}>
                          {venue.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowVenueForm(true)}
                      className="text-sm text-orange-600 hover:text-orange-700 flex items-center space-x-1"
                    >
                      <Plus size={14} />
                      <span>Add new restaurant/bar</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newVenue.name}
                        onChange={(e) => setNewVenue(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Restaurant/Bar name"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        type="button"
                        onClick={handleCreateVenue}
                        className="px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowVenueForm(false)}
                      className="text-sm text-gray-600 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images (up to 3)
                </label>
                <div className="space-y-4">
                  {formData.images.length < 3 && (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to upload images</span>
                        <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</span>
                      </label>
                    </div>
                  )}
                  
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Write your love letter to this dish... What makes it special? When do you crave it? What keeps you coming back?"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.title || !formData.content || !formData.venue_id}
                  className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Menu Proc (+5 points)'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* What is a Menu Proc Modal */}
      {showWhatIsMenuProc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">What is a Menu Proc?</h3>
              <button
                onClick={() => setShowWhatIsMenuProc(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 text-gray-600">
              <p>
                A Menu Proc is a love letter to <strong>one specific dish</strong> from a local restaurant or bar.
              </p>
              <p>
                It's not a review of the entire restaurant – it's your passionate recommendation for that one dish that keeps you coming back.
              </p>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-orange-800 font-medium">
                  "When I crave this dish, I go here."
                </p>
                <p className="text-orange-800 font-medium mt-2">
                  "I go here to get this dish."
                </p>
              </div>
              <p>
                Share what makes that dish special, when you crave it, and why others should try it!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
import React, { useState, useEffect } from 'react'
import { Search, Menu, X, User, Calendar, Music, MapPin, Home, Star, Plus, Bell, Heart, BarChart3, Building2 } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthModal } from './AuthModal'
import { ContactModal } from './ContactModal'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    { name: 'Feed', href: '/feed', icon: Heart },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Agenda', href: '/agenda', icon: Calendar },
    { name: 'Artists', href: '/artists', icon: Music },
    { name: 'Venues', href: '/venues', icon: MapPin },
    { name: 'Organizers', href: '/organizers', icon: Building2 },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Searching for:', searchQuery)
  }

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  const isActiveRoute = (href: string) => {
    return location.pathname === href || 
           (href !== '/' && location.pathname.startsWith(href))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Top Navigation */}
      <header className="hidden lg:block sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img
                  src="https://pjuyzybsyguuqaesiiyu.supabase.co/storage/v1/object/public/site-images/785-logo.png"
                  alt="seveneightfive"
                  className="h-10 w-auto"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="flex space-x-1">
              {navigation.filter(item => item.name !== 'Feed').map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActiveRoute(item.href)
                      ? 'bg-black text-[#FFCE03]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-2 ${
                    isActiveRoute(item.href)
                      ? 'text-[#FFCE03]'
                      : 'text-gray-400'
                  }`} />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Section */}
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="btn-black px-4 py-2"
                  >
                    Dashboard
                  </Link>
                  <div className="relative group">
                    <button className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </button>
                    {/* Dropdown menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="py-2">
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {profile?.username || user.email?.split('@')[0]}
                          </p>
                        </div>
                        <button
                          onClick={() => setContactModalOpen(true)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Contact Us
                        </button>
                        <button
                          onClick={signOut}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal('signin')}
                    className="btn-black px-4 py-2"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setContactModalOpen(true)}
                    className="btn-white px-4 py-2"
                  >
                    Contact Us
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 lg:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50 h-16">
        <div className="grid grid-cols-5 h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center justify-center text-white hover:text-[#FFCE03] transition-colors"
          >
            <img
              src="https://pjuyzybsyguuqaesiiyu.supabase.co/storage/v1/object/public/site-images/785-White-TopOnly.png"
              alt="seveneightfive"
              className="h-6 w-auto"
            />
          </Link>
          
          {navigation.filter(item => item.name !== 'Home' && item.name !== 'Dashboard' && item.name !== 'Feed' && item.name !== 'Agenda' && item.name !== 'Organizers').map((item) => {
            const isActive = isActiveRoute(item.href)
            return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive ? 'text-[#FFCE03]' : 'text-white hover:text-[#FFCE03]'
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
          })}
          
          {/* Profile/Dashboard Button */}
          <button
            onClick={() => {
              if (user) {
                navigate('/dashboard')
              } else {
                openAuthModal('signin')
              }
            }}
            className="flex flex-col items-center justify-center space-y-1 text-white hover:text-[#FFCE03] transition-colors"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              user ? 'bg-[#FFCE03]' : 'bg-gray-600'
            }`}>
              <User size={16} className={user ? 'text-black' : 'text-white'} />
            </div>
            <span className="text-xs font-medium">{user ? 'Dashboard' : 'Sign In'}</span>
          </button>
        </div>
      </nav>

      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
      
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { Search, Menu, X, User, Calendar, Music, MapPin, Home, Star, Plus, Bell, Heart, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    const stored = localStorage.getItem('sidebarExpanded')
    return stored !== null ? stored === 'true' : true
  })
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('sidebarExpanded', String(sidebarExpanded))
  }, [sidebarExpanded])

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded)
  }

  const navigation = [
    { name: 'Feed', href: '/feed', icon: Heart },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Artists', href: '/artists', icon: Music },
    { name: 'Venues', href: '/venues', icon: MapPin },
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
    <div className="min-h-screen bg-gray-50">

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
        sidebarExpanded ? 'lg:w-64' : 'lg:w-20'
      }`}>
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-100">
          <div className="flex flex-1 flex-col pt-5 pb-4 overflow-y-auto">
            <div className={`flex items-center flex-shrink-0 transition-all duration-300 ${
              sidebarExpanded ? 'px-3' : 'px-2 justify-center'
            }`}>
              <Link to="/" className="flex items-center">
                {sidebarExpanded ? (
                  <img
                    src="/785 Logo Valentine.png"
                    alt="seveneightfive"
                    className="h-8 w-auto"
                  />
                ) : (
                  <img
                    src="/785 Logo Valentine.png"
                    alt="seveneightfive"
                    className="h-10 w-10 object-contain"
                  />
                )}
              </Link>
            </div>

            {/* Toggle Button */}
            <div className={`mt-4 flex ${sidebarExpanded ? 'justify-end px-3' : 'justify-center'}`}>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {sidebarExpanded ? (
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>

            {/* Navigation */}
            <nav className={`mt-6 flex-1 space-y-1 transition-all duration-300 ${
              sidebarExpanded ? 'px-3' : 'px-2'
            }`}>
              {navigation.filter(item => item.name !== 'Feed').map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center py-2 text-sm font-medium rounded-lg transition-colors relative ${
                    sidebarExpanded ? 'px-3' : 'px-0 justify-center'
                  } ${
                    isActiveRoute(item.href)
                      ? 'bg-black text-[#FFCE03]'
                      : 'text-gray-700 hover:bg-black hover:text-white'
                  }`}
                  title={!sidebarExpanded ? item.name : undefined}
                >
                  <item.icon className={`h-5 w-5 transition-all ${
                    sidebarExpanded ? 'mr-3' : 'mr-0'
                  } ${
                    isActiveRoute(item.href)
                      ? 'text-[#FFCE03]'
                      : 'text-gray-400 group-hover:text-white'
                  }`} />
                  {sidebarExpanded && (
                    <span className="transition-opacity duration-200">
                      {item.name}
                    </span>
                  )}
                  {!sidebarExpanded && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                      {item.name}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* User Section */}
            <div className={`flex-shrink-0 pb-4 transition-all duration-300 ${
              sidebarExpanded ? 'px-6' : 'px-2'
            }`}>
              {sidebarExpanded ? (
                <>
                  {/* Tagline */}
                  <div className="mb-4">
                    <p className="text-sm font-oswald font-medium text-gray-700 text-center">
                      Local. Vocal. Since 2006.
                    </p>
                  </div>

                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {profile?.username || user.email?.split('@')[0]}
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/dashboard"
                        className="btn-black w-full text-center inline-block"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => setContactModalOpen(true)}
                        className="btn-white w-full text-center inline-block"
                      >
                        Contact Us
                      </button>
                      <button
                        onClick={signOut}
                        className="w-full text-left text-sm text-gray-500 hover:text-gray-700"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => openAuthModal('signin')}
                        className="btn-black w-full text-center"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => setContactModalOpen(true)}
                        className="btn-white w-full text-center inline-block"
                      >
                        Contact Us
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  {user ? (
                    <Link
                      to="/dashboard"
                      className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors group relative"
                      title="Dashboard"
                    >
                      <User className="w-5 h-5 text-white" />
                      <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                        Dashboard
                      </span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => openAuthModal('signin')}
                      className="w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors group relative"
                      title="Sign In"
                    >
                      <User className="w-5 h-5 text-[#FFCE03]" />
                      <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                        Sign In
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pb-20 lg:pb-0 transition-all duration-300 ease-in-out ${
        sidebarExpanded ? 'lg:pl-64' : 'lg:pl-20'
      }`}>
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
              src="https://assets.softr-files.com/applications/06852328-a343-4027-96ff-d4aff30169c8/assets/3bd00154-80ee-4525-8f04-dd8c544af6e7.png" 
              alt="EventHub" 
              className="h-6 w-auto"
            />
          </Link>
          
          {navigation.filter(item => item.name !== 'Home' && item.name !== 'Dashboard' && item.name !== 'Feed').map((item) => {
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

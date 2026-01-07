import React, { useState, useRef, useEffect } from 'react'
import { Search, Menu, X, User, Calendar, Music, MapPin, Home, Star, Plus, Bell, Heart, BarChart3, Palette, LogOut, ChevronDown } from 'lucide-react'
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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileDropdownOpen])

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Art', href: '/art', icon: Palette },
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

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (user?.email) {
      return user.email.split('@')[0][0].toUpperCase()
    }
    return 'U'
  }

  const handleSignOut = async () => {
    setProfileDropdownOpen(false)
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 h-16">
        <div className="h-16 px-4 lg:px-8 flex items-center justify-between">
          {/* Left: Logo (desktop only shows in sidebar, but we show simplified version on mobile) */}
          <Link to="/" className="lg:hidden flex items-center">
            <img
              src="/785 Logo Valentine.png"
              alt="seveneightfive"
              className="h-6 w-auto"
            />
          </Link>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-auto ml-64">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button type="submit" className="absolute right-3 top-2.5 text-gray-400">
                  <Search size={18} />
                </button>
              </div>
            </form>
          </div>

          {/* Right: Auth Area */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-10 h-10 rounded-full bg-blue-500 text-white font-medium flex items-center justify-center hover:bg-blue-600 transition-colors"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile?.full_name || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    getInitials()
                  )}
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.full_name || user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Edit Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('signin')}
                className="hidden md:block px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-gray-700 hover:text-black transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

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
                    src="https://pjuyzybsyguuqaesiiyu.supabase.co/storage/v1/object/public/site-images/785-logo.png"
                    alt="seveneightfive"
                    className="h-12 w-auto"
                  />
                ) : (
                  <img
                    src="https://pjuyzybsyguuqaesiiyu.supabase.co/storage/v1/object/public/site-images/785-logo.png"
                    alt="seveneightfive"
                    className="h-14 w-14 object-contain"
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
                    <p className="text-sm font-urbanist font-medium text-gray-700 text-center">
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

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30 mt-16"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <nav className="lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-white z-40 overflow-y-auto shadow-lg">
            <div className="flex flex-col h-full">
              {/* Navigation Items */}
              <div className="flex-1 px-4 py-6 space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActiveRoute(item.href)
                        ? 'bg-black text-[#FFCE03]'
                        : 'text-gray-700 hover:bg-black hover:text-white'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${
                      isActiveRoute(item.href)
                        ? 'text-[#FFCE03]'
                        : 'text-gray-400 group-hover:text-white'
                    }`} />
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Tagline */}
              <div className="px-6 py-4">
                <p className="text-xs font-oswald font-medium text-gray-700 text-center">
                  Local. Vocal. Since 2006.
                </p>
              </div>

              {/* Auth Section */}
              <div className="px-4 py-4 space-y-2 border-t border-gray-200">
                {user ? (
                  <>
                    <div className="flex items-center px-3 py-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-medium flex items-center justify-center">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile?.full_name || 'User'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          getInitials()
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {profile?.full_name || user.email?.split('@')[0]}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Edit Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        openAuthModal('signin')
                        setMobileMenuOpen(false)
                      }}
                      className="btn-black w-full text-center"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setContactModalOpen(true)
                        setMobileMenuOpen(false)
                      }}
                      className="btn-white w-full text-center inline-block"
                    >
                      Contact Us
                    </button>
                  </>
                )}
              </div>
            </div>
          </nav>
        </>
      )}

      {/* Main Content */}
      <main className="pt-16 lg:pt-0 lg:pl-64 pb-0">
        {children}
      </main>


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

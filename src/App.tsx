import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { ScrollToTop } from './components/ScrollToTop'
import { ProfileCompletionModal } from './components/ProfileCompletionModal'
import { useAuth } from './hooks/useAuth'
import { initGA, trackPageView, setUserId } from './lib/analytics'
import { HomePage } from './pages/HomePage'
import { EventsDirectoryPage } from './pages/EventsDirectoryPage'
import { AgendaPage } from './pages/AgendaPage'
import { ArtistsDirectoryPage } from './pages/ArtistsDirectoryPage'
import { VenuesDirectoryPage } from './pages/VenuesDirectoryPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { ArtistDetailPage } from './pages/ArtistDetailPage'
import { VenueDetailPage } from './pages/VenueDetailPage'
import { OrganizersDirectoryPage } from './pages/OrganizersDirectoryPage'
import { OrganizerDetailPage } from './pages/OrganizerDetailPage'
import { ProfilePage } from './pages/ProfilePage'
import { DashboardPage } from './pages/DashboardPage'
import { FeedPage } from './pages/FeedPage'

function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])

  return null
}

function App() {
  const { user, needsProfileCompletion, authMethod, completeProfile } = useAuth()

  useEffect(() => {
    initGA()
  }, [])

  useEffect(() => {
    if (user) {
      setUserId(user.id)
    }
  }, [user])

  const handleProfileComplete = async (data: { full_name: string; phone_number?: string; email?: string }) => {
    await completeProfile(data)
  }

  return (
    <Router>
      <ScrollToTop />
      <AnalyticsTracker />
      <ProfileCompletionModal
        isOpen={needsProfileCompletion && !!user}
        authMethod={authMethod || 'email'}
        currentEmail={user?.email}
        currentPhone={user?.phone}
        onComplete={handleProfileComplete}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/events" element={<EventsDirectoryPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/artists" element={<ArtistsDirectoryPage />} />
        <Route path="/venues" element={<VenuesDirectoryPage />} />
        <Route path="/events/:slug" element={<EventDetailPage />} />
        <Route path="/artists/:slug" element={<ArtistDetailPage />} />
        <Route path="/venues/:slug" element={<VenueDetailPage />} />
        <Route path="/organizers" element={<OrganizersDirectoryPage />} />
        <Route path="/organizers/:slug" element={<OrganizerDetailPage />} />
      </Routes>
    </Router>
  )
}

export default App
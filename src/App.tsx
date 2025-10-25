import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ScrollToTop } from './components/ScrollToTop'
import { ProfileCompletionModal } from './components/ProfileCompletionModal'
import { useAuth } from './hooks/useAuth'
import { HomePage } from './pages/HomePage'
import { EventsDirectoryPage } from './pages/EventsDirectoryPage'
import { AgendaPage } from './pages/AgendaPage'
import { ArtistsDirectoryPage } from './pages/ArtistsDirectoryPage'
import { VenuesDirectoryPage } from './pages/VenuesDirectoryPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { ArtistDetailPage } from './pages/ArtistDetailPage'
import { VenueDetailPage } from './pages/VenueDetailPage'
import { ProfilePage } from './pages/ProfilePage'
import { DashboardPage } from './pages/DashboardPage'
import { FeedPage } from './pages/FeedPage'

function App() {
  const { user, needsProfileCompletion, authMethod, completeProfile } = useAuth()

  const handleProfileComplete = async (data: { full_name: string; phone_number?: string; email?: string }) => {
    await completeProfile(data)
  }

  return (
    <Router>
      <ScrollToTop />
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
      </Routes>
    </Router>
  )
}

export default App
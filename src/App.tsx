import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ScrollToTop } from './components/ScrollToTop'
import { HomePage } from './pages/HomePage'
import { EventsDirectoryPage } from './pages/EventsDirectoryPage'
import { ArtistsDirectoryPage } from './pages/ArtistsDirectoryPage'
import { VenuesDirectoryPage } from './pages/VenuesDirectoryPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { ArtistDetailPage } from './pages/ArtistDetailPage'
import { VenueDetailPage } from './pages/VenueDetailPage'
import { ProfilePage } from './pages/ProfilePage'
import { DashboardPage } from './pages/DashboardPage'
import { ArtPage } from './pages/ArtPage'

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/art" element={<ArtPage />} />
        <Route path="/events" element={<EventsDirectoryPage />} />
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

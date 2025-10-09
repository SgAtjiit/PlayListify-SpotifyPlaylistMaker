import React from 'react'
import AppFunction from './components/AppFunction'
import { Route, Routes } from 'react-router-dom'
import Authenticate from './components/Authenticate'
import LoginPage from './components/LoginPage'
import Profile from './components/Profile'
import Entry from './components/Entry'
import UpdateProfile from './components/UpdateProfile'
import TopTracks from './components/TopTracks'
import TopArtists from './components/TopArtists'
import UserPlaylists from './components/UserPlaylists'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import { Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import ManagePlaylist from './components/ManagePlaylist'

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex flex-col">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="flex-1">
        <Routes>
          {/* Public Routes - No authentication required */}
          <Route path='/' element={<Entry />} />
          
          {/* Public Route - Redirect to app if already logged in */}
          <Route 
            path='/login' 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes - Authentication required */}
          <Route 
            path='/authSpotify' 
            element={
              <ProtectedRoute>
                <Authenticate />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path='/app' 
            element={
              <ProtectedRoute>
                <AppFunction />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path='/profile' 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path='/update-profile' 
            element={
              <ProtectedRoute>
                <UpdateProfile />
              </ProtectedRoute>
            }
          />

          <Route 
            path='/top-tracks' 
            element={
              <ProtectedRoute>
                <TopTracks />
              </ProtectedRoute>
            }
          />

          <Route 
            path='/top-artists' 
            element={
              <ProtectedRoute>
                <TopArtists />
              </ProtectedRoute>
            }
          />

          <Route 
            path='/playlists' 
            element={
              <ProtectedRoute>
                <UserPlaylists />
              </ProtectedRoute>
            }
          />
          <Route 
            path='/manage-playlists' 
            element={
              <ProtectedRoute>
                <ManagePlaylist/>
              </ProtectedRoute>
            }
          />

          {/* Catch all route - redirect to login */}
          <Route 
            path='*' 
            element={
              <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
                <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  <p className="text-gray-400 text-xl mb-2">Page Not Found</p>
                  <p className="text-gray-500 text-sm mb-4">The page you're looking for doesn't exist.</p>
                  <a 
                    href="/"
                    className="bg-green-500 hover:bg-green-600 text-black font-semibold py-2 px-4 rounded-lg transition duration-200 inline-block"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
      
      <Footer />
    </div>
  )
}

export default App
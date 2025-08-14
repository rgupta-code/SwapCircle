import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import ItemsPage from './pages/Items/ItemsPage'
import ItemDetailPage from './pages/Items/ItemDetailPage'
import CreateItemPage from './pages/Items/CreateItemPage'
import ProfilePage from './pages/Profile/ProfilePage'
import UserProfilePage from './pages/Profile/UserProfilePage'
import TradesPage from './pages/Trades/TradesPage'
import TradeDetailPage from './pages/Trades/TradeDetailPage'
import MessagesPage from './pages/Messages/MessagesPage'
import SearchPage from './pages/Search/SearchPage'
import MatchingPage from './pages/Matching/MatchingPage'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const App: React.FC = () => {
  const { user } = useAuth()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
          <Route path="items" element={<ItemsPage />} />
          <Route path="items/:id" element={<ItemDetailPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="users/:username" element={<UserProfilePage />} />
        </Route>

        {/* Protected Routes */}
        <Route path="/" element={<Layout />}>
          <Route path="create-item" element={
            <ProtectedRoute>
              <CreateItemPage />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="trades" element={
            <ProtectedRoute>
              <TradesPage />
            </ProtectedRoute>
          } />
          <Route path="trades/:id" element={
            <ProtectedRoute>
              <TradeDetailPage />
            </ProtectedRoute>
          } />
          <Route path="messages" element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          } />
          <Route path="matching" element={
            <ProtectedRoute>
              <MatchingPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  )
}

export default App

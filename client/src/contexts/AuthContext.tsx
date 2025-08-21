import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'

interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  avatarUrl?: string
  trustScore: number
  isVerified: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

interface RegisterData {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Memoize checkAuth function to avoid unnecessary re-renders
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      // Fetch current user (token is automatically added by axios interceptor)
      const response = await api.get('/auth/me')
      const userData = response.data.user

      setUser({
        id: userData.id,
        email: userData.email,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        avatarUrl: userData.avatar_url,
        trustScore: userData.trust_score,
        isVerified: userData.is_verified,
      })
    } catch (error: any) {
      console.error('Auth check failed:', error)
      // Only remove token if it's an authentication error (401, 403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token')
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Check if user is authenticated on mount and when checkAuth changes
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [checkAuth])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user: userData } = response.data

      // Store token
      localStorage.setItem('token', token)

      // Set user state
      setUser({
        id: userData.id,
        email: userData.email,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        avatarUrl: userData.avatar_url,
        trustScore: userData.trust_score,
        isVerified: userData.is_verified,
      })

      toast.success('Welcome back!')
      navigate('/')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post('/auth/register', {
        email: userData.email,
        username: userData.username,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
      })

      const { token, user: newUser } = response.data

      // Store token
      localStorage.setItem('token', token)

      // Set user state
      setUser({
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        avatarUrl: newUser.avatar_url,
        trustScore: newUser.trust_score,
        isVerified: newUser.is_verified,
      })

      toast.success('Account created successfully!')
      navigate('/')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed'
      toast.error(message)
      throw error
    }
  }

  const logout = () => {
    // Clear user state
    setUser(null)
    
    // Remove token
    localStorage.removeItem('token')
    
    // Clear React Query cache
    queryClient.clear()
    
    // Navigate to home
    navigate('/')
    
    toast.success('Logged out successfully')
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData })
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

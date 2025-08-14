import React from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Avatar,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Search as SearchIcon,
  SwapHoriz as SwapIcon,
  Security as SecurityIcon,
  Recycling as EcoIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useQuery } from 'react-query'
import api from '../services/api'

interface FeaturedItem {
  id: string
  title: string
  description: string
  images: string[]
  condition: string
  itemType: string
  estimatedValue: number
  user: {
    username: string
    firstName: string
    lastName: string
    avatarUrl?: string
    trustScore: number
  }
  category: {
    name: string
    icon: string
    color: string
  }
}

const HomePage: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { user } = useAuth()
  const navigate = useNavigate()

  // Fetch featured items
  const { data: featuredItems = [] } = useQuery(
    ['featuredItems'],
    async () => {
      const response = await api.get('/items?featured=true&limit=6')
      return response.data.items
    }
  )

  // Fetch popular categories
  const { data: popularCategories = [] } = useQuery(
    ['popularCategories'],
    async () => {
      const response = await api.get('/search/popular')
      return response.data.popularCategories
    }
  )

  const features = [
    {
      icon: <SwapIcon sx={{ fontSize: 40 }} />,
      title: 'AI-Powered Matching',
      description: 'Our intelligent system suggests perfect trades based on your interests and preferences.',
      color: theme.palette.primary.main,
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Trust & Safety',
      description: 'Verified users, secure messaging, and a robust rating system ensure safe trading.',
      color: theme.palette.secondary.main,
    },
    {
      icon: <EcoIcon sx={{ fontSize: 40 }} />,
      title: 'Sustainable Living',
      description: 'Reduce waste and promote circular economy by giving items a second life.',
      color: '#10B981',
    },
  ]

  const stats = [
    { label: 'Active Users', value: '10K+', icon: <TrendingIcon /> },
    { label: 'Items Listed', value: '50K+', icon: <SwapIcon /> },
    { label: 'Successful Trades', value: '25K+', icon: <StarIcon /> },
    { label: 'Categories', value: '12+', icon: <SearchIcon /> },
  ]

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 700,
                  mb: 3,
                  lineHeight: 1.2,
                }}
              >
                Trade Without
                <br />
                <span style={{ color: '#FFD700' }}>Money</span>
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontWeight: 400,
                }}
              >
                Join SwapCircle - the modern barter marketplace where you can exchange
                goods and services sustainably while building community connections.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {user ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/create-item')}
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      px: 4,
                      py: 1.5,
                      '&:hover': {
                        bgcolor: 'grey.100',
                      },
                    }}
                  >
                    List an Item
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/register')}
                      sx={{
                        bgcolor: 'white',
                        color: 'primary.main',
                        px: 4,
                        py: 1.5,
                        '&:hover': {
                          bgcolor: 'grey.100',
                        },
                      }}
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/login')}
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        px: 4,
                        py: 1.5,
                        '&:hover': {
                          borderColor: 'white',
                          bgcolor: 'rgba(255,255,255,0.1)',
                        },
                      }}
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <Box
                  component="img"
                  src="/hero-illustration.svg"
                  alt="Barter Trading"
                  sx={{
                    width: '100%',
                    maxWidth: 500,
                    height: 'auto',
                    filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: 6, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      color: 'primary.main',
                      mb: 2,
                      p: 2,
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      opacity: 0.1,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography variant="h3" fontWeight="bold" color="primary">
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            textAlign="center"
            sx={{ mb: 6, fontWeight: 700 }}
          >
            Why Choose SwapCircle?
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 4,
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[8],
                    },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Box
                    sx={{
                      color: feature.color,
                      mb: 3,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" fontWeight="600" sx={{ mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Featured Items Section */}
      {featuredItems.length > 0 && (
        <Box sx={{ py: 8, bgcolor: 'background.paper' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h2" fontWeight="700">
                Featured Items
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate('/items')}
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                View All
              </Button>
            </Box>
            <Grid container spacing={3}>
              {featuredItems.slice(0, 6).map((item: FeaturedItem) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                    onClick={() => navigate(`/items/${item.id}`)}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={item.images[0] || '/placeholder-item.jpg'}
                      alt={item.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" fontWeight="600" noWrap sx={{ maxWidth: '70%' }}>
                          {item.title}
                        </Typography>
                        <Chip
                          label={`$${item.estimatedValue}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {item.description.substring(0, 80)}...
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            src={item.user.avatarUrl}
                            sx={{ width: 24, height: 24 }}
                          >
                            {item.user.firstName.charAt(0)}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {item.user.username}
                          </Typography>
                        </Box>
                        <Chip
                          label={item.condition}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/items')}
                sx={{ display: { xs: 'block', sm: 'none' } }}
              >
                Browse All Items
              </Button>
            </Box>
          </Container>
        </Box>
      )}

      {/* CTA Section */}
      <Box sx={{ py: 8, bgcolor: 'primary.main', color: 'white' }}>
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h3" fontWeight="700" sx={{ mb: 3 }}>
              Ready to Start Trading?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of users who are already enjoying the benefits of sustainable barter trading.
            </Typography>
            {!user && (
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                  '&:hover': {
                    bgcolor: 'grey.100',
                  },
                }}
              >
                Create Free Account
              </Button>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default HomePage

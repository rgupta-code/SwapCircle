import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Container,
  Badge,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  Add as AddIcon,
  SwapHoriz as SwapIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery } from 'react-query'
import api from '../../services/api'

const Layout: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { user, logout, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get unread message count - MUST be called before any early returns
  const { data: unreadCount = 0 } = useQuery(
    ['unreadMessages'],
    async () => {
      const response = await api.get('/messages/unread/count')
      return response.data.unreadCount
    },
    {
      enabled: !!user && !loading,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}>
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    )
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleProfileMenuClose()
    logout()
  }

  const navigationItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Browse Items', icon: <SearchIcon />, path: '/items' },
    { text: 'AI Matching', icon: <SwapIcon />, path: '/matching' },
    { text: 'My Trades', icon: <SwapIcon />, path: '/trades' },
    { text: 'Messages', icon: <MessageIcon />, path: '/messages' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
  ]

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="primary" fontWeight="bold">
          SwapCircle
        </Typography>
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem
            key={item.text}
            button
            onClick={() => {
              navigate(item.path)
              if (isMobile) setMobileOpen(false)
            }}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname === item.path ? 'primary.main' : 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Container maxWidth="xl">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              SwapCircle
            </Typography>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Button
                color="inherit"
                startIcon={<SearchIcon />}
                onClick={() => navigate('/items')}
              >
                Browse
              </Button>
              <Button
                color="inherit"
                startIcon={<SwapIcon />}
                onClick={() => navigate('/matching')}
              >
                AI Matching
              </Button>
            </Box>

            {/* User Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {user ? (
                <>
                  <Button
                    color="inherit"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/create-item')}
                    sx={{ display: { xs: 'none', sm: 'flex' } }}
                  >
                    List Item
                  </Button>

                  <IconButton
                    color="inherit"
                    onClick={() => navigate('/messages')}
                  >
                    <Badge badgeContent={unreadCount} color="error">
                      <MessageIcon />
                    </Badge>
                  </IconButton>

                  <IconButton
                    onClick={handleProfileMenuOpen}
                    sx={{ p: 0 }}
                  >
                    <Avatar
                      alt={`${user.firstName} ${user.lastName}`}
                      src={user.avatarUrl}
                      sx={{ width: 32, height: 32 }}
                    >
                      {user.firstName.charAt(0)}
                    </Avatar>
                  </IconButton>

                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleProfileMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
                      <ListItemIcon>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      Profile
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/trades'); handleProfileMenuClose(); }}>
                      <ListItemIcon>
                        <SwapIcon fontSize="small" />
                      </ListItemIcon>
                      My Trades
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                      </ListItemIcon>
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate('/register')}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: 250 }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - 250px)` },
          mt: '64px', // AppBar height
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default Layout

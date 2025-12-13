import React, { PropsWithChildren, useState } from 'react';
import { NavLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import SearchInput from './SearchInput';
import { Link } from 'react-router-dom';

const navItems = [
  { to: '/lfucg', label: 'Overview', end: true },
  { to: '/lfucg/contributors', label: 'Contributors' },
  { to: '/lfucg/recipients', label: 'Recipients' },
];

const LfucgLayout = ({ children }: PropsWithChildren) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Box sx={{ py: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            fontWeight: 900,
            fontSize: '1.5rem',
          }}
        >
          LT
        </Box>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.to} disablePadding>
            <ListItemButton component={NavLink} to={item.to} end={(item as any).end}>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2, display: { md: 'none' } }} onClick={handleDrawerToggle}>
            <MenuIcon />
          </IconButton>

          {/* Mobile search toggle - visible only on xs */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', mr: 1 }}>
            {mobileSearchOpen ? (
              <IconButton color="inherit" onClick={() => setMobileSearchOpen(false)} sx={{ mr: 1 }}>
                <CloseIcon />
              </IconButton>
            ) : (
              <IconButton color="inherit" onClick={() => setMobileSearchOpen(true)} sx={{ mr: 1 }}>
                <SearchIcon />
              </IconButton>
            )}
          </Box>

          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'white',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                fontWeight: 900,
                fontSize: '1.25rem',
              }}
            >
              LT
            </Box>
            <Box>
              <Typography variant="h6" component="div" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
                The Lexington Times
              </Typography>
              <Typography variant="caption" sx={{ lineHeight: 1, opacity: 0.9, display: { xs: 'none', sm: 'block' } }}>
                Open Source Local News
              </Typography>
            </Box>
          </Box>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            {navItems.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                end={(item as any).end}
                color="inherit"
                sx={{
                  color: 'common.white',
                  fontWeight: 600,
                  '&.active': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Toolbar>

        {/* Inline mobile search bar shown under the toolbar when open */}
        {mobileSearchOpen && (
          <Box sx={{ display: { xs: 'block', md: 'none' }, px: 2, pb: 2 }}>
            <Container maxWidth="lg">
              <SearchInput label="" placeholder="Search contributors, recipients, cities..." value={searchValue} onChange={setSearchValue} />
            </Container>
          </Box>
        )}
      </AppBar>

      <Drawer anchor="left" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }}>
        {drawer}
      </Drawer>

      <Container component="main" sx={{ flex: 1, py: { xs: 3, md: 4 } }} maxWidth="lg">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
            2026 LFUCG Primary Election
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Campaign contribution data for Lexington-Fayette Urban County Government races
          </Typography>
        </Box>
        {children}
      </Container>

      <Box
        component="footer"
        sx={{
          borderTop: '1px solid #e0e0e0',
          bgcolor: '#f8f9fa',
          py: 3,
          mt: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Data sourced from Kentucky Registry of Election Finance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Built by The Lexington Times · Open Source Local News
              </Typography>
            </Box>
            <Box>
              <Button
                component={Link}
                to="/"
                variant="outlined"
                size="small"
                sx={{ color: 'text.secondary', borderColor: '#e0e0e0' }}
              >
                View Historical Data (2022-2024)
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LfucgLayout;


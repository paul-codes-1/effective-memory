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

const navItems = [
  { to: '/', label: 'Overview', end: true },
  { to: '/contributors', label: 'Contributors' },
  { to: '/recipients', label: 'Recipients' },
];

const Layout = ({ children }: PropsWithChildren) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Local Contributors
      </Typography>
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
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
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

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Local Contributors Dashboard
          </Typography>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            {navItems.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                end={(item as any).end}
                color="inherit"
                sx={{ color: 'common.white', fontWeight: 600 }}
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

      <Container component="main" sx={{ flex: 1, py: { xs: 2, md: 4 } }} maxWidth="lg">
        {children}
      </Container>

      <Box component="footer" sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
        Data sourced from local filings · Built with React & Vite
      </Box>
    </Box>
  );
};

export default Layout;

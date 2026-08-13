import { PropsWithChildren, useState } from 'react';
import AdSlot from './AdSlot';
import { NavLink, Link } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
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

const navItems: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Overview', end: true },
  { to: '/contributors', label: 'Contributors' },
  { to: '/recipients', label: 'Recipients' },
  { to: '/employers', label: 'Employers' },
  { to: '/races', label: 'Races' },
];

const LfucgLayout = ({ children }: PropsWithChildren) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const drawer = (
    <Box sx={{ width: 260 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
              fontWeight: 900,
              fontSize: '1.1rem',
            }}
          >
            LT
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            The Lexington Times
          </Typography>
        </Box>
        <IconButton onClick={handleDrawerToggle} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <List onClick={handleDrawerToggle}>
        {navItems.map((item) => (
          <ListItem key={item.to} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.to}
              end={item.end}
              sx={{ '&.active': { bgcolor: 'action.selected', fontWeight: 700 } }}
            >
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
              <Typography
                variant="h6"
                component="div"
                sx={{ lineHeight: 1.2, fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
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
                end={item.end}
                color="inherit"
                sx={{
                  color: 'common.white',
                  fontWeight: 600,
                  '&.active': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }}>
        {drawer}
      </Drawer>

      <Container component="main" sx={{ flex: 1, py: { xs: 2, md: 4 } }} maxWidth="lg">
        <Box sx={{ mb: { xs: 2, md: 3 } }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              mb: 0.5,
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' },
            }}
          >
            2026 LFUCG Primary Election
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Campaign contribution data for Lexington-Fayette Urban County Government races
          </Typography>
        </Box>
        {children}
        <AdSlot slot="8662540292" />
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
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography variant="body2" color="text.secondary">
                Data sourced from Kentucky Registry of Election Finance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Built by The Lexington Times
              </Typography>
            </Box>
            <Button
              component={Link}
              to="/archive"
              variant="outlined"
              size="small"
              sx={{ color: 'text.secondary', borderColor: '#e0e0e0' }}
            >
              View Historical Data (2022-2024)
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LfucgLayout;

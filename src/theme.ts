import { createTheme, responsiveFontSizes } from '@mui/material/styles';

const baseTheme = createTheme({
  palette: {
    background: {
      default: '#f5f7fb',
    },
    primary: {
      main: '#1d4ed8',
    },
    secondary: {
      main: '#0ea5e9',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            padding: '6px 8px',
            fontSize: '0.8125rem',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        sizeSmall: {
          '@media (max-width: 600px)': {
            height: 22,
            fontSize: '0.7rem',
          },
        },
      },
    },
  },
});

const theme = responsiveFontSizes(baseTheme);

export default theme;

import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import LfucgLayout from './components/LfucgLayout';
import ContributorsPage from './routes/ContributorsPage';
import ContributorDetailPage from './routes/ContributorDetailPage';
import OverviewPage from './routes/OverviewPage';
import RecipientsPage from './routes/RecipientsPage';
import RecipientDetailPage from './routes/RecipientDetailPage';
import LfucgOverviewPage from './routes/lfucg/LfucgOverviewPage';
import LfucgContributorsPage from './routes/lfucg/LfucgContributorsPage';
import LfucgContributorDetailPage from './routes/lfucg/LfucgContributorDetailPage';
import LfucgRecipientsPage from './routes/lfucg/LfucgRecipientsPage';
import LfucgRecipientDetailPage from './routes/lfucg/LfucgRecipientDetailPage';
import LfucgEmployersPage from './routes/lfucg/LfucgEmployersPage';
import LfucgEmployerDetailPage from './routes/lfucg/LfucgEmployerDetailPage';
import { LfucgContributorsProvider } from './hooks/useLfucgContributors';
import { ContributorsProvider } from './hooks/useContributors';
import lfucgTheme from './lfucgTheme';

/** Redirect old /lfucg/* URLs to their new root equivalents */
const LfucgRedirect = () => {
  const { pathname } = useLocation();
  const newPath = pathname.replace(/^\/lfucg(?=\/|$)/, '') || '/';
  return <Navigate to={newPath} replace />;
};

const App = () => {
  return (
    <Routes>
      {/* Backward-compat: redirect old /lfucg paths to root */}
      <Route path="/lfucg/*" element={<LfucgRedirect />} />

      {/* Historical Data (2022-2024) — archived */}
      <Route
        path="/archive/*"
        element={
          <ContributorsProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/contributors" element={<ContributorsPage />} />
                <Route path="/contributors/:slug" element={<ContributorDetailPage />} />
                <Route path="/recipients" element={<RecipientsPage />} />
                <Route path="/recipients/:slug" element={<RecipientDetailPage />} />
                <Route path="*" element={<Navigate to="/archive" replace />} />
              </Routes>
            </Layout>
          </ContributorsProvider>
        }
      />

      {/* LFUCG 2026 Primary Portal — now the root */}
      <Route
        path="/*"
        element={
          <ThemeProvider theme={lfucgTheme}>
            <CssBaseline />
            <LfucgContributorsProvider>
              <LfucgLayout>
                <Routes>
                  <Route path="/" element={<LfucgOverviewPage />} />
                  <Route path="/contributors" element={<LfucgContributorsPage />} />
                  <Route path="/contributors/:slug" element={<LfucgContributorDetailPage />} />
                  <Route path="/recipients" element={<LfucgRecipientsPage />} />
                  <Route path="/recipients/:slug" element={<LfucgRecipientDetailPage />} />
                  <Route path="/employers" element={<LfucgEmployersPage />} />
                  <Route path="/employers/:slug" element={<LfucgEmployerDetailPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </LfucgLayout>
            </LfucgContributorsProvider>
          </ThemeProvider>
        }
      />
    </Routes>
  );
};

export default App;

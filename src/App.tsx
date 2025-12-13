import { Navigate, Route, Routes } from 'react-router-dom';
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
import { LfucgContributorsProvider } from './hooks/useLfucgContributors';
import lfucgTheme from './lfucgTheme';

const App = () => {
  return (
    <Routes>
      {/* LFUCG 2026 Primary Portal */}
      <Route path="/lfucg/*" element={
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
                <Route path="*" element={<Navigate to="/lfucg" replace />} />
              </Routes>
            </LfucgLayout>
          </LfucgContributorsProvider>
        </ThemeProvider>
      } />

      {/* Historical Data (2022-2024) */}
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/contributors" element={<ContributorsPage />} />
            <Route path="/contributors/:slug" element={<ContributorDetailPage />} />
            <Route path="/recipients" element={<RecipientsPage />} />
            <Route path="/recipients/:slug" element={<RecipientDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  );
};

export default App;

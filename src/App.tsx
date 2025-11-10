import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ContributorsPage from './routes/ContributorsPage';
import ContributorDetailPage from './routes/ContributorDetailPage';
import OverviewPage from './routes/OverviewPage';
import RecipientsPage from './routes/RecipientsPage';
import RecipientDetailPage from './routes/RecipientDetailPage';

const App = () => {
  return (
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
  );
};

export default App;

import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { CategoryPage } from './pages/CategoryPage';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/client" element={<CategoryPage category="CLIENT" />} />
        <Route path="/collection" element={<CategoryPage category="COLLECTION" />} />
        <Route path="/thematique" element={<CategoryPage category="THEMATIQUE" />} />
        <Route path="/spa" element={<CategoryPage category="SPA" />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

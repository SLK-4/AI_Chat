import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from '@/components/Layout';
import ChatPage from '@/pages/ChatPage/ChatPage';
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage';
import { AppProvider } from '@/context/AppContext';

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ChatPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </AppProvider>
  );
}

import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import AppShell from '@/components/layout/AppShell'
import LoginPage from '@/pages/LoginPage'
import HomeEditor from '@/pages/editors/HomeEditor'
import AboutEditor from '@/pages/editors/AboutEditor'
import WorkEditor from '@/pages/editors/WorkEditor'
import PricingEditor from '@/pages/editors/PricingEditor'
import InsightsEditor from '@/pages/editors/InsightsEditor'
import ContactEditor from '@/pages/editors/ContactEditor'
import SiteSettingsEditor from '@/pages/editors/SiteSettingsEditor'
import ArticlesListPage from '@/pages/articles/ArticlesListPage'
import ArticleEditorPage from '@/pages/articles/ArticleEditorPage'
import SubmissionsPage from '@/pages/SubmissionsPage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomeEditor /> },
      { path: 'about', element: <AboutEditor /> },
      { path: 'work', element: <WorkEditor /> },
      { path: 'pricing', element: <PricingEditor /> },
      { path: 'insights', element: <InsightsEditor /> },
      { path: 'contact', element: <ContactEditor /> },
      { path: 'articles', element: <ArticlesListPage /> },
      { path: 'articles/new', element: <ArticleEditorPage /> },
      { path: 'articles/:id', element: <ArticleEditorPage /> },
      { path: 'submissions', element: <SubmissionsPage /> },
      { path: 'settings', element: <SiteSettingsEditor /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

import { Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import {
  CategoriesPage,
  CategoryDetailPage,
  DashboardPage,
  NotFoundPage,
  SettingsPage,
  TopicStudyPage,
} from '@/pages/Pages'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/:categoryId" element={<CategoryDetailPage />} />
        <Route path="categories/:categoryId/topics/:topicId" element={<TopicStudyPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

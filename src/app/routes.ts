import type { LucideIcon } from 'lucide-react'
import { BookOpen, FolderOpen, LayoutDashboard, Settings2 } from 'lucide-react'

export type NavigationItem = {
  label: string
  href: string
  icon: LucideIcon
  end?: boolean
}

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, end: true },
  { label: 'Categories', href: '/categories', icon: FolderOpen },
  { label: 'Settings', href: '/settings', icon: Settings2 },
]

export function getPageTitle(pathname: string) {
  if (pathname === '/') return 'Dashboard'
  if (pathname === '/categories') return 'Categories'
  if (pathname === '/settings') return 'Settings'
  if (pathname.includes('/topics/')) return 'Topic study'
  if (pathname.startsWith('/categories/')) return 'Category detail'
  return 'Study Reviewer'
}

export const productMark = BookOpen

import { Menu } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { navigationItems } from '@/app/routes'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function PrimaryNav() {
  return (
    <nav aria-label="Primary navigation" className="flex min-w-max items-center gap-1">
      {navigationItems.map(({ label, href, icon: Icon, end }) => (
        <NavLink
          key={href}
          to={href}
          end={end}
          className={({ isActive }) =>
            cn(
              'group flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-base font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              'hover:bg-secondary/70 hover:text-secondary-foreground',
              isActive && 'bg-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground',
            )
          }
        >
          <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export function MobileNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button aria-label="Open navigation menu" size="icon" variant="ghost" />}>
        <Menu aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Navigate</DropdownMenuLabel>
          {navigationItems.map(({ label, href, icon: Icon, end }) => (
            <DropdownMenuItem key={href} render={<NavLink to={href} end={end} />}>
              <Icon aria-hidden="true" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

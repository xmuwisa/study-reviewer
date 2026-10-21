import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import { navigationItems } from '@/app/routes'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog'
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
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button aria-label="Open navigation menu" className="[&_svg]:size-6" size="icon" variant="ghost" />}>
        <Menu aria-hidden="true" />
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="!top-0 !left-0 !h-dvh !w-full !max-w-none !translate-x-0 !translate-y-0 !rounded-none bg-background p-6 ease-out duration-300 data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right data-closed:ease-in sm:hidden"
      >
        <DialogClose render={<Button aria-label="Close navigation menu" className="absolute top-4 right-4" size="icon" variant="ghost" />}>
          <X aria-hidden="true" />
        </DialogClose>
        <nav aria-label="Mobile navigation" className="flex flex-col gap-2 pr-12 pt-1">
          {navigationItems.map(({ label, href, icon: Icon, end }) => (
            <DialogClose
              key={href}
              render={
                <NavLink
                  to={href}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      'hover:bg-secondary/70 hover:text-secondary-foreground',
                      isActive && 'bg-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground',
                    )
                  }
                />
              }
            >
              <Icon aria-hidden="true" strokeWidth={1.8} />
              <span>{label}</span>
            </DialogClose>
          ))}
        </nav>
      </DialogContent>
    </Dialog>
  )
}

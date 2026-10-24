import { CheckCircle2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export type NotificationState = {
  kind: 'success' | 'error'
  message: string
}

export function Notification({
  notification,
  onDismiss,
}: {
  notification: NotificationState | null
  onDismiss: () => void
}) {
  const [isExiting, setIsExiting] = useState(false)
  const onDismissRef = useRef(onDismiss)

  useEffect(() => {
    onDismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    if (!notification) {
      setIsExiting(false)
      return
    }

    setIsExiting(false)
    const exitTimeoutId = window.setTimeout(() => setIsExiting(true), 2200)
    const removeTimeoutId = window.setTimeout(() => onDismissRef.current(), 2400)

    return () => {
      window.clearTimeout(exitTimeoutId)
      window.clearTimeout(removeTimeoutId)
    }
  }, [notification?.kind, notification?.message])

  if (!notification) return null

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-8 z-50 flex justify-start sm:inset-x-auto sm:left-6" aria-live="polite">
      <p
        className={cn(
          'flex max-w-full items-center gap-2 rounded-xl border border-border bg-popover px-4 py-3 text-sm font-medium text-popover-foreground shadow-xl',
          isExiting ? 'animate-out fade-out slide-out-to-bottom-2 duration-200' : 'animate-in fade-in slide-in-from-bottom-2 duration-200',
        )}
        role={notification.kind === 'error' ? 'alert' : 'status'}
      >
        {notification.kind === 'success' && <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />}
        <span>{notification.message}</span>
      </p>
    </div>
  )
}

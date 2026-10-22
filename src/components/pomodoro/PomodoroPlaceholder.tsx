import { Clock3 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

function TomatoMark() {
  return (
    <div className="relative flex size-16 items-center justify-center" aria-hidden="true">
      <div className="absolute inset-0 rounded-full border-[5px] border-[#f5dfd3] bg-[#ed5d50]" />
      <div className="absolute top-1.5 left-1/2 h-2.5 w-6 -translate-x-1/2 rotate-[-8deg] rounded-full bg-[#2c7650]" />
      <div className="absolute top-2 left-1/2 h-2.5 w-5 -translate-x-1/2 translate-x-1 rotate-[17deg] rounded-full bg-[#3c8a5b]" />
      <span className="relative z-10 text-sm font-semibold text-white">25</span>
    </div>
  )
}

export function PomodoroPlaceholder() {
  return (
    <aside className="w-full max-w-sm" aria-label="Pomodoro timer placeholder">
      <Card className="w-full bg-secondary/95 backdrop-blur lg:w-72">
        <CardContent className="flex items-center gap-3 p-3.5">
          <TomatoMark />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-heading text-base font-semibold">Pomodoro</p>
              <Badge variant="secondary" className="h-6 px-2 text-xs font-medium">
                Soon
              </Badge>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              A focused timer will be added as the study workspace grows.
            </p>
          </div>
          <Clock3 aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </aside>
  )
}

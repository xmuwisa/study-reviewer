import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react'
import { Bell, Check, ChevronDown, Clock3, Pause, Play, RotateCcw, Volume2, X } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import {
  getPomodoroModeLabel,
  getPomodoroRemainingSeconds,
  POMODORO_MINUTES_MAX,
  POMODORO_MINUTES_MIN,
} from '@/lib/pomodoro'
import type { PomodoroMode } from '@/lib/study-data'
import { useStudyData } from '@/lib/use-study-data'

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function getNotificationPermission(): NotificationPermission | 'unsupported' {
  return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
}

function playCompletionSound() {
  if (typeof window === 'undefined' || !window.AudioContext) return

  const context = new window.AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(660, context.currentTime)
  oscillator.frequency.linearRampToValueAtTime(880, context.currentTime + 0.18)
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45)
  oscillator.connect(gain)
  gain.connect(context.destination)
  void context.resume().catch(() => undefined)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.45)
  oscillator.addEventListener('ended', () => void context.close(), { once: true })
}

function TomatoDial({
  minutes,
  remainingSeconds,
  progress,
  disabled,
  onPointerStart,
  onPointerMove,
  onPointerEnd,
  onKeyDown,
}: {
  minutes: number
  remainingSeconds: number
  progress: number
  disabled: boolean
  onPointerStart: (event: PointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void
  onPointerEnd: (event: PointerEvent<HTMLDivElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
}) {
  const displayMinutes = Math.max(0, Math.ceil(remainingSeconds / 60))

  return (
    <div
      aria-label={`Duration ${minutes} minutes`}
      aria-valuemax={POMODORO_MINUTES_MAX}
      aria-valuemin={POMODORO_MINUTES_MIN}
      aria-valuenow={minutes}
      aria-valuetext={`${minutes} minutes`}
      className={cn(
        'relative mx-auto aspect-square w-full max-w-[21rem] touch-none rounded-full bg-secondary p-3 shadow-[0_18px_45px_-25px_var(--destructive)] outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50',
        disabled ? 'cursor-default' : 'cursor-crosshair active:scale-[0.99]',
      )}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerStart}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      role="slider"
      tabIndex={disabled ? -1 : 0}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full opacity-90"
        style={{ background: 'repeating-conic-gradient(from 0deg, var(--destructive) 0deg 1.5deg, transparent 1.5deg 6deg)' }}
      />
      <div className="absolute inset-[0.8rem] rounded-full border-4 border-destructive/70 bg-destructive shadow-inner sm:inset-4">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full opacity-25"
          style={{ background: `conic-gradient(from 0deg, transparent ${progress * 360}deg, var(--card) ${progress * 360}deg)` }}
        />
        <div aria-hidden="true" className="absolute top-[10%] left-1/2 h-7 w-12 -translate-x-1/2">
          <span className="absolute top-1 left-1/2 h-5 w-7 -translate-x-full -rotate-12 rounded-[100%_0_100%_0] bg-accent-foreground" />
          <span className="absolute top-1 left-1/2 h-5 w-7 translate-x-0 rotate-12 rounded-[0_100%_0_100%] bg-accent-foreground/90" />
          <span className="absolute top-3 left-1/2 h-6 w-2 -translate-x-1/2 rotate-45 rounded-full bg-accent-foreground" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <span className="font-heading text-5xl font-semibold tracking-tight sm:text-6xl">{displayMinutes}</span>
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/85">minutes</span>
          <span className="mt-3 font-mono text-lg font-medium tabular-nums text-white/90">{formatTime(remainingSeconds)}</span>
          <span className="mt-2 text-sm text-white/80">{disabled ? 'Pause or reset to adjust' : 'Rotate to adjust'}</span>
        </div>
      </div>
    </div>
  )
}

export function PomodoroTimer() {
  const { data, selectPomodoroMode, abandonPomodoroSession, startPomodoro, pausePomodoro, resumePomodoro, resetPomodoro, adjustPomodoroDuration } = useStudyData()
  const [isOpen, setIsOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [draftDuration, setDraftDuration] = useState(data.timer.selectedDurationMinutes)
  const [pendingMode, setPendingMode] = useState<PomodoroMode | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(getNotificationPermission)
  const previousCompletedSessions = useRef(data.activity.completedFocusSessions)
  const dialPointerId = useRef<number | null>(null)
  const session = data.timer.activeSession
  const isRunning = session?.status === 'running'
  const isPaused = session?.status === 'paused'
  const isActive = Boolean(isRunning || isPaused)
  const remainingSeconds = session ? getPomodoroRemainingSeconds(session, now) : draftDuration * 60
  const selectedMinutes = session?.durationMinutes ?? draftDuration
  const progress = session ? Math.min(1, remainingSeconds / Math.max(1, session.durationMinutes * 60)) : 1

  useEffect(() => {
    if (!isRunning) return
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [isRunning])

  useEffect(() => {
    if (!isActive) setDraftDuration(data.timer.selectedDurationMinutes)
  }, [data.timer.selectedDurationMinutes, isActive])

  useEffect(() => {
    if (data.activity.completedFocusSessions <= previousCompletedSessions.current) {
      previousCompletedSessions.current = data.activity.completedFocusSessions
      return
    }

    previousCompletedSessions.current = data.activity.completedFocusSessions
    if (data.settings.pomodoro.soundEnabled) playCompletionSound()
    if (data.settings.pomodoro.notificationsEnabled && notificationPermission === 'granted') {
      try {
        new Notification('Focus session complete', { body: 'Your next study interval is ready.' })
      } catch {
        // Permission can be revoked between checking it and constructing a notification.
      }
    }
  }, [data.activity.completedFocusSessions, data.settings.pomodoro.notificationsEnabled, data.settings.pomodoro.soundEnabled, notificationPermission])

  function commitDuration(value: number) {
    const nextValue = Math.min(POMODORO_MINUTES_MAX, Math.max(POMODORO_MINUTES_MIN, Math.round(value)))
    setDraftDuration(nextValue)
    adjustPomodoroDuration(nextValue)
  }

  function getSliderValue(value: number | readonly number[]) {
    return typeof value === 'number' ? value : value[0] ?? draftDuration
  }

  function getMinutesFromPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - (bounds.left + bounds.width / 2)
    const y = event.clientY - (bounds.top + bounds.height / 2)
    const angle = (Math.atan2(x, -y) + Math.PI * 2) % (Math.PI * 2)
    return POMODORO_MINUTES_MIN + Math.round((angle / (Math.PI * 2)) * (POMODORO_MINUTES_MAX - POMODORO_MINUTES_MIN))
  }

  function handlePointerStart(event: PointerEvent<HTMLDivElement>) {
    if (isActive) return
    dialPointerId.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    setDraftDuration(getMinutesFromPointer(event))
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dialPointerId.current !== event.pointerId) return
    setDraftDuration(getMinutesFromPointer(event))
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (dialPointerId.current !== event.pointerId) return
    dialPointerId.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    commitDuration(getMinutesFromPointer(event))
  }

  function handleDialKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isActive) return
    const current = draftDuration
    const step = event.shiftKey ? 5 : 1
    let next = current
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step
    if (event.key === 'PageUp') next = current + 5
    if (event.key === 'PageDown') next = current - 5
    if (event.key === 'Home') next = POMODORO_MINUTES_MIN
    if (event.key === 'End') next = POMODORO_MINUTES_MAX
    if (next === current) return
    event.preventDefault()
    commitDuration(next)
  }

  function handleModeChange(value: string[]) {
    const mode = value[0]
    if (mode !== 'focus' && mode !== 'short-break' && mode !== 'long-break') return
    if (isActive) {
      setPendingMode(mode)
      return
    }
    selectPomodoroMode(mode)
  }

  async function requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported')
      return
    }
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
  }

  const notificationMessage = notificationPermission === 'unsupported'
    ? 'This browser does not support notifications.'
    : notificationPermission === 'denied'
      ? 'Notifications are blocked in this browser; the timer will still run.'
      : notificationPermission === 'granted'
        ? 'Browser notifications are ready.'
        : 'Allow browser notifications when a Focus session completes.'

  return (
    <aside
      className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex w-[min(25rem,calc(100vw-2rem))] flex-col items-end gap-3 sm:right-6"
      aria-label="Pomodoro timer"
    >
      {isOpen && (
        <Card className="w-full border border-border/80 bg-card/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/85">
          <CardHeader className="flex-row items-start justify-between gap-4 p-5 pb-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Pomodoro</p>
              <CardTitle className="mt-2 text-2xl">A gentler focus rhythm</CardTitle>
              <CardDescription className="mt-1">Choose a mode, set the interval, then return to your study path.</CardDescription>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Close Pomodoro timer" onClick={() => setIsOpen(false)}>
              <X aria-hidden="true" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 p-5 pt-2">
            <ToggleGroup value={[data.timer.selectedMode]} onValueChange={handleModeChange} aria-label="Pomodoro mode" className="w-full">
              <ToggleGroupItem value="focus" className="flex-1">Focus</ToggleGroupItem>
              <ToggleGroupItem value="short-break" className="flex-1">Short Break</ToggleGroupItem>
              <ToggleGroupItem value="long-break" className="flex-1">Long Break</ToggleGroupItem>
            </ToggleGroup>

            <TomatoDial
              minutes={selectedMinutes}
              remainingSeconds={remainingSeconds}
              progress={progress}
              disabled={isActive}
              onPointerStart={handlePointerStart}
              onPointerMove={handlePointerMove}
              onPointerEnd={handlePointerEnd}
              onKeyDown={handleDialKeyDown}
            />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4 text-sm font-medium text-muted-foreground">
                <span>Duration</span>
                <span className="tabular-nums">{selectedMinutes} min</span>
              </div>
              <Slider
                aria-label="Pomodoro duration"
                className="py-2"
                disabled={isActive}
                max={POMODORO_MINUTES_MAX}
                min={POMODORO_MINUTES_MIN}
                onValueChange={(value) => setDraftDuration(getSliderValue(value))}
                onValueCommitted={(value) => commitDuration(getSliderValue(value))}
                step={1}
                value={[draftDuration]}
              />
              <div className="flex justify-between text-xs text-muted-foreground"><span>1 min</span><span>120 min</span></div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!isActive && <Button type="button" className="min-w-28 flex-1" onClick={() => startPomodoro()}><Play aria-hidden="true" data-icon="inline-start" />Start</Button>}
              {isRunning && <Button type="button" className="min-w-28 flex-1" variant="secondary" onClick={() => pausePomodoro()}><Pause aria-hidden="true" data-icon="inline-start" />Pause</Button>}
              {isPaused && <Button type="button" className="min-w-28 flex-1" onClick={() => resumePomodoro()}><Play aria-hidden="true" data-icon="inline-start" />Resume</Button>}
              {isActive && <Button type="button" variant="outline" onClick={() => resetPomodoro()}><RotateCcw aria-hidden="true" data-icon="inline-start" />Reset</Button>}
            </div>

            <div className="flex flex-col gap-3 rounded-xl bg-muted/45 p-3">
              <div className="flex items-center gap-2 text-sm font-medium"><Clock3 aria-hidden="true" className="size-4 text-primary" />{getPomodoroModeLabel(data.timer.selectedMode)} · {isRunning ? 'Running' : isPaused ? 'Paused' : 'Ready'}</div>
              {data.settings.pomodoro.notificationsEnabled && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm leading-relaxed text-muted-foreground">{notificationMessage}</p>
                  {notificationPermission === 'default' && <Button type="button" variant="outline" size="sm" className="w-fit" onClick={requestNotificationPermission}><Bell aria-hidden="true" data-icon="inline-start" />Enable notifications</Button>}
                  {notificationPermission === 'granted' && <p className="flex items-center gap-2 text-sm font-medium text-accent-foreground"><Check aria-hidden="true" className="size-4" />Notifications enabled</p>}
                </div>
              )}
              {data.settings.pomodoro.soundEnabled && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Volume2 aria-hidden="true" className="size-4" />Sound alert is enabled in Settings.</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        type="button"
        variant="secondary"
        className="h-auto min-h-14 rounded-2xl px-3 py-2 shadow-xl"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close Pomodoro timer' : 'Open Pomodoro timer'}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="relative flex size-10 items-center justify-center rounded-full border-4 border-destructive/70 bg-destructive text-xs font-semibold text-white">
          <span aria-hidden="true" className="absolute -top-1.5 left-1/2 h-2.5 w-5 -translate-x-1/2 rounded-full bg-accent-foreground" />
          {isActive ? Math.max(0, Math.ceil(remainingSeconds / 60)) : data.timer.selectedDurationMinutes}
        </span>
        <span className="flex flex-col items-start gap-0.5 pr-1 text-left">
          <span className="text-sm font-semibold">{getPomodoroModeLabel(data.timer.selectedMode)}</span>
          <span className="text-xs text-muted-foreground">{isRunning ? formatTime(remainingSeconds) : isPaused ? 'Paused' : 'Start timer'}</span>
        </span>
        <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      <AlertDialog open={pendingMode !== null} onOpenChange={(open) => { if (!open) setPendingMode(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch Pomodoro mode?</AlertDialogTitle>
            <AlertDialogDescription>
              This will abandon the current {isPaused ? 'paused' : 'running'} {getPomodoroModeLabel(data.timer.selectedMode)} session. It will not count as completed, and the new mode will use its saved default duration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current session</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingMode) abandonPomodoroSession(pendingMode); setPendingMode(null) }}>Switch mode</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}

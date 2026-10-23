import { useCallback, useEffect, useRef, useState } from 'react'

import { getPomodoroRemainingSeconds } from '@/lib/pomodoro'
import { POMODORO_ALARM_OPTIONS, WEB_AUTOMATIC_ALARM_AUDIO_ENABLED } from '@/lib/pomodoro-audio'
import type { PomodoroMode } from '@/lib/study-data'
import { useStudyData } from '@/lib/use-study-data'

import { clampDuration, formatTimer, TIMER_MODES } from './pomodoro-model'

export type PomodoroController = {
  mode: PomodoroMode
  duration: number
  preciseDuration: string
  isRunning: boolean
  hasStarted: boolean
  remainingSeconds: number
  remainingLabel: string
  indicatorDurationMinutes: number
  alarmActive: boolean
  modeLabel: string
  setDurationValue: (value: number) => void
  handleModeChange: (value: string[]) => void
  handleReset: () => void
  handlePlayPause: () => void
  handlePreciseDurationChange: (value: string) => void
  commitPreciseDuration: () => void
  stopAlarm: () => void
  snoozeAlarm: () => void
}

export function usePomodoroController(): PomodoroController {
  const {
    data,
    updateSettings,
    selectPomodoroMode,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    snoozePomodoro,
    resetPomodoro,
    completePomodoroSession,
  } = useStudyData()
  const [preciseDuration, setPreciseDuration] = useState(() => String(data.settings.pomodoro.focusMinutes))
  const [now, setNow] = useState(() => Date.now())
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null)
  const alarmSourceRef = useRef<string | null>(null)
  const alarmRetryCleanupRef = useRef<(() => void) | null>(null)
  const alarmRetrySourceRef = useRef<string | null>(null)
  const alarmPlayPendingRef = useRef(false)
  const alarmPlayRef = useRef<(source: string) => Promise<boolean>>(() => Promise.resolve(false))
  const alarmAnnouncementRef = useRef<string | null>(null)
  const session = data.timer.activeSession
  const mode = data.timer.selectedMode
  const modeConfig = TIMER_MODES[mode]
  const duration = data.settings.pomodoro[modeConfig.durationKey]
  const selectedAlarm = POMODORO_ALARM_OPTIONS.find((option) => option.value === data.settings.pomodoro.defaultAlarm) ?? POMODORO_ALARM_OPTIONS[0]
  const remainingSeconds = session ? getPomodoroRemainingSeconds(session, now) : duration * 60
  const alarmActive = Boolean(session && (session.status === 'completed' || (session.status === 'running' && remainingSeconds === 0)))
  const isRunning = Boolean(session?.status === 'running' && !alarmActive)
  const hasStarted = Boolean(session)

  const clearAlarmRetry = useCallback(() => {
    alarmRetryCleanupRef.current?.()
    alarmRetryCleanupRef.current = null
    alarmRetrySourceRef.current = null
  }, [])

  const queueAlarmRetry = useCallback((source: string) => {
    if (alarmRetryCleanupRef.current && alarmRetrySourceRef.current === source) return

    clearAlarmRetry()
    const retry = () => {
      clearAlarmRetry()
      void alarmPlayRef.current(source)
    }
    const cleanup = () => {
      document.removeEventListener('pointerdown', retry, true)
      document.removeEventListener('keydown', retry, true)
    }

    alarmRetrySourceRef.current = source
    alarmRetryCleanupRef.current = cleanup
    document.addEventListener('pointerdown', retry, { capture: true, once: true })
    document.addEventListener('keydown', retry, { capture: true, once: true })
  }, [clearAlarmRetry])

  const prepareAlarmAudio = useCallback((source: string) => {
    if (alarmAudioRef.current && alarmSourceRef.current === source) return alarmAudioRef.current

    alarmAudioRef.current?.pause()
    if (alarmAudioRef.current) alarmAudioRef.current.currentTime = 0
    const audio = new Audio(source)
    audio.loop = true
    audio.preload = 'auto'
    alarmAudioRef.current = audio
    alarmSourceRef.current = source
    audio.load()
    return audio
  }, [])

  const playAlarmAudio = useCallback(async (source: string) => {
    const audio = prepareAlarmAudio(source)
    audio.loop = true
    audio.muted = false

    if (alarmPlayPendingRef.current || !audio.paused) return true

    alarmPlayPendingRef.current = true
    try {
      await audio.play()
      clearAlarmRetry()
      return true
    } catch {
      if (alarmAudioRef.current === audio) queueAlarmRetry(source)
      return false
    } finally {
      alarmPlayPendingRef.current = false
    }
  }, [clearAlarmRetry, prepareAlarmAudio, queueAlarmRetry])

  alarmPlayRef.current = playAlarmAudio

  const primeAlarmAudio = useCallback((source: string) => {
    const audio = prepareAlarmAudio(source)
    audio.muted = true
    void audio.play().then(() => {
      if (alarmAudioRef.current !== audio) return
      audio.pause()
      audio.currentTime = 0
      audio.muted = false
    }).catch(() => {
      if (alarmAudioRef.current === audio) audio.muted = false
    })
  }, [prepareAlarmAudio])

  const stopAlarmAudio = useCallback(() => {
    clearAlarmRetry()
    alarmPlayPendingRef.current = false
    alarmAudioRef.current?.pause()
    if (alarmAudioRef.current) {
      alarmAudioRef.current.currentTime = 0
      alarmAudioRef.current.muted = false
    }
    alarmAudioRef.current = null
    alarmSourceRef.current = null
  }, [clearAlarmRetry])

  useEffect(() => {
    if (!session || session.status !== 'running') return

    const updateNow = () => setNow(Date.now())
    updateNow()
    const intervalId = window.setInterval(updateNow, 1000)
    window.addEventListener('focus', updateNow)
    document.addEventListener('visibilitychange', updateNow)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', updateNow)
      document.removeEventListener('visibilitychange', updateNow)
    }
  }, [session?.endsAt, session?.pausedAt, session?.status])

  useEffect(() => {
    if (!session) setPreciseDuration(String(duration))
  }, [duration, session])

  useEffect(() => {
    if (!alarmActive) {
      alarmAnnouncementRef.current = null
      return
    }

    if (!WEB_AUTOMATIC_ALARM_AUDIO_ENABLED) {
      stopAlarmAudio()
      return
    }

    if (!data.settings.pomodoro.soundEnabled || !selectedAlarm.src) {
      stopAlarmAudio()
      return
    }

    const alarmIdentity = `${session?.completedAt ?? session?.endsAt ?? 'unknown'}:${selectedAlarm.src}`
    if (alarmAnnouncementRef.current !== alarmIdentity) {
      alarmAnnouncementRef.current = alarmIdentity
      window.dispatchEvent(new Event('pomodoro-alarm-start'))
    }

    void playAlarmAudio(selectedAlarm.src)
  }, [alarmActive, data.settings.pomodoro.soundEnabled, playAlarmAudio, selectedAlarm.src, session?.completedAt, session?.endsAt, stopAlarmAudio])

  useEffect(() => () => stopAlarmAudio(), [stopAlarmAudio])

  function setDurationValue(value: number) {
    const nextDuration = clampDuration(value)
    const saved = updateSettings({ pomodoro: { [modeConfig.durationKey]: nextDuration } })
    setPreciseDuration(saved ? String(nextDuration) : String(duration))
  }

  function handleModeChange(value: string[]) {
    if (alarmActive || session?.status === 'running' || session?.status === 'paused') return
    const nextMode = value[0]
    if (nextMode !== 'focus' && nextMode !== 'short-break' && nextMode !== 'long-break') return

    selectPomodoroMode(nextMode)
    setPreciseDuration(String(data.settings.pomodoro[TIMER_MODES[nextMode].durationKey]))
  }

  function handleReset() {
    stopAlarmAudio()
    resetPomodoro()
  }

  function handlePlayPause() {
    if (alarmActive) return
    if (WEB_AUTOMATIC_ALARM_AUDIO_ENABLED && selectedAlarm.src) primeAlarmAudio(selectedAlarm.src)

    if (session?.status === 'running') {
      pausePomodoro()
      return
    }
    if (session?.status === 'paused') {
      resumePomodoro()
      return
    }

    startPomodoro()
  }

  function handlePreciseDurationChange(value: string) {
    setPreciseDuration(value)
    if (value === '') return

    const parsedValue = Number(value)
    if (Number.isFinite(parsedValue)) setDurationValue(parsedValue)
  }

  function commitPreciseDuration() {
    const parsedValue = Number(preciseDuration)
    setDurationValue(Number.isFinite(parsedValue) ? parsedValue : duration)
  }

  function stopAlarm() {
    if (!session || !alarmActive) return

    stopAlarmAudio()
    completePomodoroSession(session.mode, session.durationMinutes)
  }

  function snoozeAlarm() {
    if (!session || !alarmActive) return

    stopAlarmAudio()
    snoozePomodoro(data.settings.pomodoro.defaultSnoozeMinutes)
  }

  return {
    mode,
    duration,
    preciseDuration,
    isRunning,
    hasStarted,
    remainingSeconds,
    remainingLabel: formatTimer(remainingSeconds),
    indicatorDurationMinutes: session ? data.timer.selectedDurationMinutes : duration,
    alarmActive,
    modeLabel: modeConfig.label,
    setDurationValue,
    handleModeChange,
    handleReset,
    handlePlayPause,
    handlePreciseDurationChange,
    commitPreciseDuration,
    stopAlarm,
    snoozeAlarm,
  }
}

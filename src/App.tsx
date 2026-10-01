import { useEffect, useRef, useState } from 'react'
import { ActivityBoard } from './components/ActivityBoard'
import { ParentSettingsPage } from './components/ParentSettingsPage'
import { ProfilePicker } from './components/ProfilePicker'
import { defaultActivities } from './data/defaultActivities'
import { loadTodayCompletions, saveCompletion } from './lib/persistence'
import { loadParentSettings, saveParentSettings } from './lib/settings'
import { pickEncouragement, speak } from './lib/speech'
import type {
  Activity,
  ChildProfile,
  CompletionMap,
  ParentSettings,
} from './types'

type Screen = 'profiles' | 'day' | 'settings'

export default function App() {
  const [screen, setScreen] = useState<Screen>('profiles')
  const [settings, setSettings] = useState<ParentSettings>(() =>
    loadParentSettings(),
  )
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [completions, setCompletions] = useState<CompletionMap>({})
  const [celebration, setCelebration] = useState<{
    activityId: string
    message: string
  } | null>(null)
  const celebrationTimer = useRef<number | null>(null)

  const selectedProfile =
    settings.children.find((child) => child.id === selectedChildId) ?? null

  useEffect(() => {
    return () => {
      if (celebrationTimer.current) {
        window.clearTimeout(celebrationTimer.current)
      }
    }
  }, [])

  const startDay = async (profile: ChildProfile) => {
    setSelectedChildId(profile.id)
    setCompletions(await loadTodayCompletions(profile.id))
    setScreen('day')
    speak(`Hi ${profile.name}! Let's have a happy day!`, settings.voice)
  }

  const updateSettings = (nextSettings: ParentSettings) => {
    setSettings(nextSettings)
    saveParentSettings(nextSettings)
    setScreen('profiles')
  }

  const completeActivity = async (activity: Activity) => {
    if (!selectedProfile) return

    if (completions[activity.id]) {
      speak('Already done! Great job!', settings.voice)
      return
    }

    const completedAt = new Date().toISOString()
    const message = pickEncouragement()

    setCompletions((current) => ({
      ...current,
      [activity.id]: completedAt,
    }))
    setCelebration({ activityId: activity.id, message })
    speak(message, settings.voice)

    if (celebrationTimer.current) {
      window.clearTimeout(celebrationTimer.current)
    }

    celebrationTimer.current = window.setTimeout(() => {
      setCelebration(null)
    }, 1800)

    await saveCompletion(selectedProfile.id, activity.id, completedAt)

    const nextCount = Object.keys(completions).length + 1
    if (nextCount === defaultActivities.length) {
      window.setTimeout(
        () =>
          speak(
            'Amazing! You finished your whole happy day!',
            settings.voice,
          ),
        2100,
      )
    }
  }

  if (screen === 'settings') {
    return (
      <ParentSettingsPage
        settings={settings}
        onSave={updateSettings}
        onCancel={() => setScreen('profiles')}
      />
    )
  }

  if (screen === 'profiles' || !selectedProfile) {
    return (
      <ProfilePicker
        profiles={settings.children}
        onSelect={startDay}
        onOpenSettings={() => setScreen('settings')}
      />
    )
  }

  return (
    <ActivityBoard
      profile={selectedProfile}
      completions={completions}
      celebration={celebration}
      onComplete={completeActivity}
      onBack={() => setScreen('profiles')}
    />
  )
}

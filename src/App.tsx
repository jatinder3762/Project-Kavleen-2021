import { useEffect, useRef, useState } from 'react'
import { ActivityBoard } from './components/ActivityBoard'
import { ProfilePicker } from './components/ProfilePicker'
import { childProfile, defaultActivities } from './data/defaultActivities'
import { loadTodayCompletions, saveCompletion } from './lib/persistence'
import { pickEncouragement, speak } from './lib/speech'
import type { Activity, CompletionMap } from './types'

const PHOTO_KEY = 'project-kavleen:profile-photo:kavleen'

export default function App() {
  const [started, setStarted] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(() =>
    localStorage.getItem(PHOTO_KEY),
  )
  const [completions, setCompletions] = useState<CompletionMap>({})
  const [celebration, setCelebration] = useState<{
    activityId: string
    message: string
  } | null>(null)
  const celebrationTimer = useRef<number | null>(null)

  useEffect(() => {
    loadTodayCompletions(childProfile.id).then(setCompletions)
  }, [])

  useEffect(() => {
    return () => {
      if (celebrationTimer.current) {
        window.clearTimeout(celebrationTimer.current)
      }
    }
  }, [])

  const startDay = () => {
    setStarted(true)
    speak(`Hi ${childProfile.name}! Let's have a happy day!`)
  }

  const savePhoto = (dataUrl: string) => {
    setPhotoDataUrl(dataUrl)
    try {
      localStorage.setItem(PHOTO_KEY, dataUrl)
    } catch {
      // Some browsers may reject a large localStorage entry.
    }
  }

  const completeActivity = async (activity: Activity) => {
    if (completions[activity.id]) {
      speak('Already done! Great job!')
      return
    }

    const completedAt = new Date().toISOString()
    const message = pickEncouragement()

    setCompletions((current) => ({
      ...current,
      [activity.id]: completedAt,
    }))
    setCelebration({ activityId: activity.id, message })
    speak(message)

    if (celebrationTimer.current) {
      window.clearTimeout(celebrationTimer.current)
    }

    celebrationTimer.current = window.setTimeout(() => {
      setCelebration(null)
    }, 1800)

    await saveCompletion(childProfile.id, activity.id, completedAt)

    const nextCount = Object.keys(completions).length + 1
    if (nextCount === defaultActivities.length) {
      window.setTimeout(() => speak('Amazing! You finished your whole happy day!'), 2100)
    }
  }

  if (!started) {
    return (
      <ProfilePicker
        profile={childProfile}
        photoDataUrl={photoDataUrl}
        onSelect={startDay}
        onPhotoSelected={savePhoto}
      />
    )
  }

  return (
    <ActivityBoard
      profile={childProfile}
      photoDataUrl={photoDataUrl}
      completions={completions}
      celebration={celebration}
      onComplete={completeActivity}
      onBack={() => setStarted(false)}
    />
  )
}

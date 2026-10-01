import { defaultActivities } from '../data/defaultActivities'
import type { Activity, ActivitySection, ChildProfile, CompletionMap } from '../types'
import { ActivityCard } from './ActivityCard'

const sections: Array<{
  id: ActivitySection
  icon: string
  label: string
}> = [
  { id: 'morning', icon: '🌅', label: 'Morning' },
  { id: 'day', icon: '☀️', label: 'Day' },
  { id: 'evening', icon: '🌇', label: 'Evening' },
  { id: 'bedtime', icon: '🌙', label: 'Bedtime' },
]

type Props = {
  profile: ChildProfile
  completions: CompletionMap
  celebration: { activityId: string; message: string } | null
  onComplete: (activity: Activity) => void
  onBack: () => void
}

export function ActivityBoard({
  profile,
  completions,
  celebration,
  onComplete,
  onBack,
}: Props) {
  const completeCount = Object.keys(completions).length

  return (
    <main className="day-screen">
      <header className="day-header">
        <button
          className="mini-profile"
          type="button"
          onClick={onBack}
          aria-label="Choose profile"
        >
          {profile.photoDataUrl ? (
            <img src={profile.photoDataUrl} alt="" />
          ) : (
            <span aria-hidden="true">{profile.emoji}</span>
          )}
        </button>

        <div className="day-title">
          <span className="day-title-icon" aria-hidden="true">🌈</span>
          <div>
            <h1>My Happy Day</h1>
            <p>{profile.name}</p>
          </div>
        </div>

        <div className="star-counter" aria-label={`${completeCount} activities completed`}>
          ⭐ <strong>{completeCount}</strong>
        </div>
      </header>

      <div className="progress-track" aria-hidden="true">
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(100, (completeCount / defaultActivities.length) * 100)}%`,
          }}
        />
      </div>

      <div className="sections">
        {sections.map((section) => {
          const activities = defaultActivities.filter(
            (activity) => activity.section === section.id,
          )

          return (
            <section className={`day-section section-${section.id}`} key={section.id}>
              <h2>
                <span aria-hidden="true">{section.icon}</span>
                <span>{section.label}</span>
              </h2>

              <div className="activity-grid">
                {activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    completedAt={completions[activity.id]}
                    celebrating={celebration?.activityId === activity.id}
                    message={
                      celebration?.activityId === activity.id
                        ? celebration.message
                        : undefined
                    }
                    onComplete={onComplete}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}

import type { Activity } from '../types'

type Props = {
  activity: Activity
  completedAt?: string
  celebrating: boolean
  message?: string
  onComplete: (activity: Activity) => void
}

export function ActivityCard({
  activity,
  completedAt,
  celebrating,
  message,
  onComplete,
}: Props) {
  const completed = Boolean(completedAt)

  return (
    <button
      type="button"
      className={[
        'activity-card',
        completed ? 'is-complete' : '',
        celebrating ? 'is-celebrating' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onComplete(activity)}
      aria-pressed={completed}
      aria-label={`${activity.label}${completed ? ', completed' : ''}`}
    >
      <span className="activity-visual" aria-hidden="true">
        {activity.emoji}
      </span>

      <span className="activity-label">{activity.label}</span>

      <span className="check-bubble" aria-hidden="true">
        {completed ? '✓' : ''}
      </span>

      {celebrating && (
        <>
          <span className="celebration-message">{message}</span>
          <span className="burst burst-one" aria-hidden="true">⭐</span>
          <span className="burst burst-two" aria-hidden="true">✨</span>
          <span className="burst burst-three" aria-hidden="true">🌟</span>
        </>
      )}
    </button>
  )
}

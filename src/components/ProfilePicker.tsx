import type { ChildProfile } from '../types'

type Props = {
  profiles: ChildProfile[]
  onSelect: (profile: ChildProfile) => void
  onOpenSettings: () => void
}

export function ProfilePicker({ profiles, onSelect, onOpenSettings }: Props) {
  return (
    <main className="welcome-screen">
      <div className="floating-decoration decoration-one">⭐</div>
      <div className="floating-decoration decoration-two">🌈</div>
      <div className="floating-decoration decoration-three">☁️</div>

      <button
        className="settings-launch"
        type="button"
        onClick={onOpenSettings}
        aria-label="Open parent settings"
      >
        ⚙️ <span>Parents</span>
      </button>

      <div className="welcome-card">
        <div className="welcome-sun">☀️</div>
        <h1>Who’s ready?</h1>

        <div className="profile-grid">
          {profiles.map((profile, index) => (
            <button
              className="profile-button"
              type="button"
              key={profile.id}
              onClick={() => onSelect(profile)}
              aria-label={`Start ${profile.name}'s day`}
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <span className="profile-sparkle sparkle-left">✨</span>
              <span className="profile-sparkle sparkle-right">⭐</span>
              <span className="profile-picture">
                {profile.photoDataUrl ? (
                  <img src={profile.photoDataUrl} alt={profile.name} />
                ) : (
                  <span className="profile-emoji" aria-hidden="true">
                    {profile.emoji}
                  </span>
                )}
              </span>
              <strong>{profile.name}</strong>
              <span className="tap-hint">👆</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}

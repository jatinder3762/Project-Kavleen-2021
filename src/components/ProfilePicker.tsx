import { useRef } from 'react'
import type { ChildProfile } from '../types'

type Props = {
  profile: ChildProfile
  photoDataUrl: string | null
  onSelect: () => void
  onPhotoSelected: (dataUrl: string) => void
}

export function ProfilePicker({
  profile,
  photoDataUrl,
  onSelect,
  onPhotoSelected,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const choosePhoto = () => inputRef.current?.click()

  const readPhoto = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 3 * 1024 * 1024) {
      window.alert('Please choose a picture smaller than 3 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onPhotoSelected(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <main className="welcome-screen">
      <div className="floating-decoration decoration-one">⭐</div>
      <div className="floating-decoration decoration-two">🌈</div>
      <div className="floating-decoration decoration-three">☁️</div>

      <div className="welcome-card">
        <div className="welcome-sun">☀️</div>
        <h1>Who’s ready?</h1>

        <button
          className="profile-button"
          type="button"
          onClick={onSelect}
          aria-label={`Start ${profile.name}'s day`}
        >
          <span className="profile-sparkle sparkle-left">✨</span>
          <span className="profile-sparkle sparkle-right">⭐</span>
          <span className="profile-picture">
            {photoDataUrl ? (
              <img src={photoDataUrl} alt={profile.name} />
            ) : (
              <span className="profile-emoji" aria-hidden="true">
                {profile.emoji}
              </span>
            )}
          </span>
          <strong>{profile.name}</strong>
          <span className="tap-hint">👆</span>
        </button>

        <button className="photo-button" type="button" onClick={choosePhoto}>
          📷 <span>Add picture</span>
        </button>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="image/*"
          onChange={(event) => readPhoto(event.target.files?.[0])}
        />
      </div>
    </main>
  )
}

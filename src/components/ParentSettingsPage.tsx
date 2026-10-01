import { useEffect, useState } from 'react'
import { createChildProfile } from '../lib/settings'
import { getEnglishVoices, speak } from '../lib/speech'
import type { ChildProfile, ParentSettings } from '../types'

type Props = {
  settings: ParentSettings
  onSave: (settings: ParentSettings) => void
  onCancel: () => void
}

export function ParentSettingsPage({ settings, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<ParentSettings>(() =>
    structuredClone(settings),
  )
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    const refreshVoices = () => setVoices(getEnglishVoices())

    refreshVoices()
    if ('speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.removeEventListener(
          'voiceschanged',
          refreshVoices,
        )
      }
    }
  }, [])

  const updateChild = (
    childId: string,
    patch: Partial<ChildProfile>,
  ) => {
    setDraft((current) => ({
      ...current,
      children: current.children.map((child) =>
        child.id === childId ? { ...child, ...patch } : child,
      ),
    }))
  }

  const addChild = () => {
    setDraft((current) => ({
      ...current,
      children: [
        ...current.children,
        createChildProfile(current.children.length + 1),
      ],
    }))
  }

  const removeChild = (childId: string) => {
    setDraft((current) => {
      if (current.children.length <= 1) return current
      return {
        ...current,
        children: current.children.filter((child) => child.id !== childId),
      }
    })
  }

  const choosePhoto = (childId: string, file?: File) => {
    if (!file || !file.type.startsWith('image/')) return

    if (file.size > 3 * 1024 * 1024) {
      window.alert('Please choose a picture smaller than 3 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateChild(childId, { photoDataUrl: reader.result })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <main className="parent-settings-screen">
      <div className="parent-settings-shell">
        <header className="parent-settings-header">
          <button className="secondary-button" type="button" onClick={onCancel}>
            ← Back
          </button>
          <div>
            <span className="parent-eyebrow">🔒 Parent area</span>
            <h1>Settings</h1>
          </div>
        </header>

        <section className="settings-panel">
          <div className="settings-panel-heading">
            <div>
              <span className="settings-icon">👧🧒</span>
              <h2>Children</h2>
              <p>Add a picture and name for each child.</p>
            </div>
            <button className="add-child-button" type="button" onClick={addChild}>
              ＋ Add child
            </button>
          </div>

          <div className="child-settings-list">
            {draft.children.map((child) => (
              <article className="child-settings-card" key={child.id}>
                <label className="child-photo-editor">
                  <span className="child-photo-preview">
                    {child.photoDataUrl ? (
                      <img src={child.photoDataUrl} alt="" />
                    ) : (
                      <span aria-hidden="true">{child.emoji}</span>
                    )}
                  </span>
                  <span className="photo-edit-label">📷 Change photo</span>
                  <input
                    className="visually-hidden"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      choosePhoto(child.id, event.target.files?.[0])
                    }
                  />
                </label>

                <div className="child-settings-fields">
                  <label>
                    <span>Child’s name</span>
                    <input
                      type="text"
                      value={child.name}
                      maxLength={30}
                      onChange={(event) =>
                        updateChild(child.id, { name: event.target.value })
                      }
                    />
                  </label>

                  <label>
                    <span>Avatar</span>
                    <select
                      value={child.emoji}
                      onChange={(event) =>
                        updateChild(child.id, { emoji: event.target.value })
                      }
                    >
                      <option value="👧">👧 Girl</option>
                      <option value="👦">👦 Boy</option>
                      <option value="🧒">🧒 Child</option>
                      <option value="🐰">🐰 Bunny</option>
                      <option value="🦄">🦄 Unicorn</option>
                      <option value="🐻">🐻 Bear</option>
                    </select>
                  </label>

                  {draft.children.length > 1 && (
                    <button
                      className="remove-child-button"
                      type="button"
                      onClick={() => removeChild(child.id)}
                    >
                      Remove child
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="settings-panel">
          <div className="settings-panel-heading">
            <div>
              <span className="settings-icon">🔊</span>
              <h2>Voice & encouragement</h2>
              <p>The app will prefer a female English voice automatically.</p>
            </div>
          </div>

          <div className="voice-settings-grid">
            <label className="toggle-row">
              <span>
                <strong>Spoken encouragement</strong>
                <small>Say “Great job!” and other positive messages.</small>
              </span>
              <input
                type="checkbox"
                checked={draft.voice.enabled}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    voice: {
                      ...current.voice,
                      enabled: event.target.checked,
                    },
                  }))
                }
              />
            </label>

            <label>
              <span>Voice</span>
              <select
                value={draft.voice.voiceURI}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    voice: {
                      ...current.voice,
                      voiceURI: event.target.value,
                    },
                  }))
                }
              >
                <option value="">Automatic female voice</option>
                {voices.map((voice) => (
                  <option value={voice.voiceURI} key={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Speaking speed</span>
              <input
                type="range"
                min="0.7"
                max="1.15"
                step="0.05"
                value={draft.voice.rate}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    voice: {
                      ...current.voice,
                      rate: Number(event.target.value),
                    },
                  }))
                }
              />
            </label>

            <button
              className="test-voice-button"
              type="button"
              onClick={() =>
                speak('Great job! You did it!', draft.voice)
              }
              disabled={!draft.voice.enabled}
            >
              ▶️ Test voice
            </button>
          </div>
        </section>

        <div className="settings-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="save-settings-button"
            type="button"
            onClick={() =>
              onSave({
                ...draft,
                children: draft.children.map((child) => ({
                  ...child,
                  name: child.name.trim() || 'My Child',
                })),
              })
            }
          >
            ✓ Save settings
          </button>
        </div>
      </div>
    </main>
  )
}

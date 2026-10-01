import type { ParentSettings } from '../types'

const SETTINGS_KEY = 'project-kavleen:parent-settings'
const LEGACY_PHOTO_KEY = 'project-kavleen:profile-photo:kavleen'

export const defaultParentSettings: ParentSettings = {
  children: [
    {
      id: 'kavleen',
      name: 'Kavleen',
      emoji: '👧',
      photoDataUrl: null,
    },
  ],
  voice: {
    enabled: true,
    voiceURI: '',
    rate: 0.9,
    pitch: 1.15,
  },
}

export function loadParentSettings(): ParentSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ParentSettings>
      return {
        children:
          parsed.children && parsed.children.length > 0
            ? parsed.children
            : defaultParentSettings.children,
        voice: {
          ...defaultParentSettings.voice,
          ...(parsed.voice ?? {}),
        },
      }
    }

    const legacyPhoto = localStorage.getItem(LEGACY_PHOTO_KEY)
    if (legacyPhoto) {
      return {
        ...defaultParentSettings,
        children: [
          {
            ...defaultParentSettings.children[0],
            photoDataUrl: legacyPhoto,
          },
        ],
      }
    }
  } catch {
    // Fall through to safe defaults.
  }

  return defaultParentSettings
}

export function saveParentSettings(settings: ParentSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function createChildProfile(index: number) {
  return {
    id: `child-${Date.now()}-${index}`,
    name: `Child ${index}`,
    emoji: index % 2 === 0 ? '🧒' : '👧',
    photoDataUrl: null,
  }
}

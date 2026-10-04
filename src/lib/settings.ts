import { cloneDefaultRoutine } from '../data/defaultActivities'
import type { ChildProfile, ParentSettings, VoiceSettings } from '../types'

const SETTINGS_KEY = 'project-kavleen:parent-settings'

export const defaultVoiceSettings: VoiceSettings = {
  enabled: true,
  voiceURI: '',
  rate: 0.9,
  pitch: 1.15,
}

export const emptyParentSettings: ParentSettings = {
  children: [],
  voice: defaultVoiceSettings,
}

export function loadParentSettings(): ParentSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ParentSettings>
      return {
        children: parsed.children ?? [],
        voice: { ...defaultVoiceSettings, ...(parsed.voice ?? {}) },
      }
    }
  } catch { /* use safe empty settings */ }
  return emptyParentSettings
}

export function saveParentSettings(settings: ParentSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function clearLocalParentSettings() {
  localStorage.removeItem(SETTINGS_KEY)
}

export function createChildProfile(index: number): ChildProfile {
  const routine = cloneDefaultRoutine()
  return {
    id: `child-${Date.now()}-${index}`,
    name: '',
    dateOfBirth: '',
    emoji: index % 2 === 0 ? '🧒' : '👧',
    photoDataUrl: null,
    ...routine,
  }
}

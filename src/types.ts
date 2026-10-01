export type ActivitySection = 'morning' | 'day' | 'evening' | 'bedtime'

export type Activity = {
  id: string
  emoji: string
  label: string
  section: ActivitySection
}

export type ChildProfile = {
  id: string
  name: string
  emoji: string
  photoDataUrl?: string | null
}

export type VoiceSettings = {
  enabled: boolean
  voiceURI: string
  rate: number
  pitch: number
}

export type ParentSettings = {
  children: ChildProfile[]
  voice: VoiceSettings
}

export type CompletionMap = Record<string, string>

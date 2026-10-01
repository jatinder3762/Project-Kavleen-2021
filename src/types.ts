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
}

export type CompletionMap = Record<string, string>

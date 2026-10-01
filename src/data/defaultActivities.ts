import type { Activity } from '../types'

export const defaultActivities: Activity[] = [
  { id: 'wake-up', emoji: '🛏️', label: 'Wake up', section: 'morning' },
  { id: 'potty-am', emoji: '🚽', label: 'Potty', section: 'morning' },
  { id: 'brush-teeth-am', emoji: '🪥', label: 'Brush teeth', section: 'morning' },
  { id: 'wash-face', emoji: '💦', label: 'Wash face', section: 'morning' },
  { id: 'get-dressed', emoji: '👕', label: 'Get dressed', section: 'morning' },
  { id: 'breakfast', emoji: '🥣', label: 'Breakfast', section: 'morning' },

  { id: 'school', emoji: '🎒', label: 'School', section: 'day' },
  { id: 'lunch', emoji: '🍎', label: 'Lunch', section: 'day' },
  { id: 'quiet-time', emoji: '🧸', label: 'Quiet time', section: 'day' },
  { id: 'outdoor-play', emoji: '🛝', label: 'Play outside', section: 'day' },
  { id: 'tidy-toys', emoji: '🧩', label: 'Tidy toys', section: 'day' },

  { id: 'dinner', emoji: '🍽️', label: 'Dinner', section: 'evening' },
  { id: 'family-time', emoji: '❤️', label: 'Family time', section: 'evening' },
  { id: 'bath', emoji: '🛁', label: 'Bath', section: 'evening' },

  { id: 'pajamas', emoji: '👚', label: 'Pajamas', section: 'bedtime' },
  { id: 'brush-teeth-pm', emoji: '🪥', label: 'Brush teeth', section: 'bedtime' },
  { id: 'potty-pm', emoji: '🚽', label: 'Potty', section: 'bedtime' },
  { id: 'story', emoji: '📖', label: 'Story', section: 'bedtime' },
  { id: 'sleep', emoji: '🌙', label: 'Sleep', section: 'bedtime' },
]

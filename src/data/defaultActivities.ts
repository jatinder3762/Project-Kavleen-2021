import type { Activity, RoutineSection } from '../types'

export const defaultSections: RoutineSection[] = [
  { id: 'morning', icon: '🌅', label: 'Morning', order: 0 },
  { id: 'day', icon: '☀️', label: 'Day', order: 1 },
  { id: 'evening', icon: '🌇', label: 'Evening', order: 2 },
  { id: 'bedtime', icon: '🌙', label: 'Bedtime', order: 3 },
]

export const defaultActivities: Activity[] = [
  { id: 'wake-up', emoji: '🛏️', label: 'Wake up', sectionId: 'morning', type: 'normal', order: 0 },
  { id: 'brush-teeth-am', emoji: '🪥', label: 'Brush teeth', sectionId: 'morning', type: 'normal', order: 1 },
  { id: 'wash-face', emoji: '💦', label: 'Wash face', sectionId: 'morning', type: 'normal', order: 2 },
  { id: 'get-dressed', emoji: '👕', label: 'Get dressed', sectionId: 'morning', type: 'normal', order: 3 },
  { id: 'wash-hands-breakfast', emoji: '🧼', label: 'Wash hands', sectionId: 'morning', type: 'recurring', order: 4 },
  { id: 'breakfast', emoji: '🥣', label: 'Breakfast', sectionId: 'morning', type: 'normal', order: 5 },
  { id: 'school', emoji: '🎒', label: 'School', sectionId: 'day', type: 'scheduled', order: 0, scheduleTime: '08:30' },
  { id: 'snack', emoji: '🍎', label: 'Snack', sectionId: 'day', type: 'normal', order: 1 },
  { id: 'outdoor-play', emoji: '🛝', label: 'Play outside', sectionId: 'day', type: 'normal', order: 2 },
  { id: 'wash-hands-play', emoji: '🧼', label: 'Wash hands', sectionId: 'day', type: 'triggered', order: 3, triggerAfterId: 'outdoor-play' },
  { id: 'homework', emoji: '📚', label: 'Homework', sectionId: 'evening', type: 'normal', order: 0 },
  { id: 'tv-time', emoji: '📺', label: 'TV time', sectionId: 'evening', type: 'timed', order: 1, durationMinutes: 30, dailyLimitMinutes: 60, reminderMinutes: [5, 1] },
  { id: 'dinner', emoji: '🍽️', label: 'Dinner', sectionId: 'evening', type: 'normal', order: 2 },
  { id: 'bath', emoji: '🛁', label: 'Bath', sectionId: 'bedtime', type: 'normal', order: 0 },
  { id: 'brush-teeth-pm', emoji: '🪥', label: 'Brush teeth', sectionId: 'bedtime', type: 'normal', order: 1 },
  { id: 'story', emoji: '📖', label: 'Story', sectionId: 'bedtime', type: 'normal', order: 2 },
  { id: 'sleep', emoji: '🌙', label: 'Sleep', sectionId: 'bedtime', type: 'scheduled', order: 3, scheduleTime: '20:30' },
]

export function cloneDefaultRoutine() {
  return {
    sections: defaultSections.map(section => ({ ...section })),
    activities: defaultActivities.map(activity => ({ ...activity, reminderMinutes: activity.reminderMinutes ? [...activity.reminderMinutes] : undefined })),
  }
}

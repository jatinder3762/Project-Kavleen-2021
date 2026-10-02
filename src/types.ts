export type ActivityType = 'normal' | 'recurring' | 'timed' | 'scheduled' | 'triggered' | 'checklist'

export type RoutineSection = { id:string; label:string; icon:string; order:number }
export type Activity = { id:string; emoji:string; label:string; sectionId:string; type:ActivityType; order:number; durationMinutes?:number; dailyLimitMinutes?:number; scheduleTime?:string; days?:number[]; triggerAfterId?:string; reminderMinutes?:number[]; enabled?:boolean }
export type ChildProfile = { id:string; name:string; emoji:string; photoDataUrl?:string|null; sections?:RoutineSection[]; activities?:Activity[] }
export type VoiceSettings = { enabled:boolean; voiceURI:string; rate:number; pitch:number }
export type ParentSettings = { children:ChildProfile[]; voice:VoiceSettings }

export type ActivityAnswerStatus = 'yes' | 'no'
export type ActivityAnswer = { status:ActivityAnswerStatus; answeredAt:string }
export type CompletionMap = Record<string, ActivityAnswer>
export type TimerSession = { activityId:string; startedAt:string; endsAt:string; durationMinutes:number }

import { supabase } from './auth'
import type { CompletionMap } from '../types'

const STORAGE_PREFIX = 'project-kavleen:completions'

export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function storageKey(childId: string, date = localDateKey()) {
  return `${STORAGE_PREFIX}:${childId}:${date}`
}

function readLocal(childId: string, date = localDateKey()): CompletionMap {
  try {
    const value = localStorage.getItem(storageKey(childId, date))
    return value ? (JSON.parse(value) as CompletionMap) : {}
  } catch {
    return {}
  }
}

function writeLocal(childId: string, completions: CompletionMap, date = localDateKey()) {
  localStorage.setItem(storageKey(childId, date), JSON.stringify(completions))
}

async function getSignedInUser(){
  if(!supabase)return null
  const {data:{user}}=await supabase.auth.getUser()
  return user && !user.is_anonymous ? user : null
}

export async function loadCompletions(childId: string, date = localDateKey()): Promise<CompletionMap> {
  const local = readLocal(childId, date)
  if (!supabase) return local

  try {
    const user = await getSignedInUser()
    if (!user) return local

    const { data, error } = await supabase
      .from('activity_events')
      .select('activity_id, occurred_at')
      .eq('child_id', childId)
      .eq('event_type','completed')
      .gte('occurred_at', date+'T00:00:00')
      .lt('occurred_at', date+'T23:59:59.999')

    if (error) throw error

    const merged = { ...local }
    for (const row of data ?? []) {
      merged[row.activity_id] = row.occurred_at
    }

    writeLocal(childId, merged, date)
    return merged
  } catch (error) {
    console.warn('Could not load Supabase completions. Using local storage.', error)
    return local
  }
}

export async function saveCompletion(
  childId: string,
  activityId: string,
  completedAt: string,
  date = localDateKey(),
) {
  const current = readLocal(childId, date)
  current[activityId] = completedAt
  writeLocal(childId, current, date)

  if (!supabase) return { synced: false }

  try {
    const user = await getSignedInUser()
    if (!user) return { synced: false }

    const { error } = await supabase.from('activity_events').insert({child_id:childId,activity_id:activityId,event_type:'completed',occurred_at:completedAt,metadata:{activity_date:date}})

    if (error) throw error
    return { synced: true }
  } catch (error) {
    console.warn('Completion saved locally but not synced to Supabase.', error)
    return { synced: false }
  }
}

export const loadTodayCompletions=(childId:string)=>loadCompletions(childId)

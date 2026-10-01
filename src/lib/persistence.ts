import { createClient, type User } from '@supabase/supabase-js'
import type { CompletionMap } from '../types'

const STORAGE_PREFIX = 'project-kavleen:completions'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

let userPromise: Promise<User | null> | null = null

export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function storageKey(childId: string, date = localDateKey()) {
  return `${STORAGE_PREFIX}:${childId}:${date}`
}

function readLocal(childId: string): CompletionMap {
  try {
    const value = localStorage.getItem(storageKey(childId))
    return value ? (JSON.parse(value) as CompletionMap) : {}
  } catch {
    return {}
  }
}

function writeLocal(childId: string, completions: CompletionMap) {
  localStorage.setItem(storageKey(childId), JSON.stringify(completions))
}

async function getOrCreateUser(): Promise<User | null> {
  if (!supabase) return null
  if (userPromise) return userPromise

  userPromise = (async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) return data.session.user

    const { data: anonymousData, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    return anonymousData.user
  })().catch((error) => {
    console.warn('Supabase anonymous sign-in unavailable. Using local storage.', error)
    userPromise = null
    return null
  })

  return userPromise
}

export async function loadTodayCompletions(childId: string): Promise<CompletionMap> {
  const local = readLocal(childId)
  if (!supabase) return local

  try {
    const user = await getOrCreateUser()
    if (!user) return local

    const { data, error } = await supabase
      .from('daily_activity_completions')
      .select('activity_key, completed_at')
      .eq('owner_id', user.id)
      .eq('child_key', childId)
      .eq('activity_date', localDateKey())

    if (error) throw error

    const merged = { ...local }
    for (const row of data ?? []) {
      merged[row.activity_key] = row.completed_at
    }

    writeLocal(childId, merged)
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
) {
  const current = readLocal(childId)
  current[activityId] = completedAt
  writeLocal(childId, current)

  if (!supabase) return { synced: false }

  try {
    const user = await getOrCreateUser()
    if (!user) return { synced: false }

    const { error } = await supabase.from('daily_activity_completions').upsert(
      {
        owner_id: user.id,
        child_key: childId,
        activity_key: activityId,
        activity_date: localDateKey(),
        completed_at: completedAt,
      },
      {
        onConflict: 'owner_id,child_key,activity_key,activity_date',
      },
    )

    if (error) throw error
    return { synced: true }
  } catch (error) {
    console.warn('Completion saved locally but not synced to Supabase.', error)
    return { synced: false }
  }
}

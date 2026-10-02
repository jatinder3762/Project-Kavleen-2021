import { supabase } from './auth'
import type { ActivityAnswerStatus, CompletionMap } from '../types'

const STORAGE_PREFIX='project-kavleen:answers'
export function localDateKey(date=new Date()){const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0');return `${year}-${month}-${day}`}
function storageKey(childId:string,date=localDateKey()){return `${STORAGE_PREFIX}:${childId}:${date}`}
function readLocal(childId:string,date=localDateKey()):CompletionMap{try{const value=localStorage.getItem(storageKey(childId,date));return value?JSON.parse(value):{}}catch{return {}}}
function writeLocal(childId:string,answers:CompletionMap,date=localDateKey()){localStorage.setItem(storageKey(childId,date),JSON.stringify(answers))}
async function getSignedInUser(){if(!supabase)return null;const {data:{user}}=await supabase.auth.getUser();return user&&!user.is_anonymous?user:null}

export async function loadCompletions(childId:string,date=localDateKey()):Promise<CompletionMap>{
 const local=readLocal(childId,date);if(!supabase)return local
 try{
  const user=await getSignedInUser();if(!user)return local
  const {data,error}=await supabase.from('activity_events').select('activity_id,event_type,occurred_at').eq('child_id',childId).in('event_type',['completed','declined']).gte('occurred_at',date+'T00:00:00').lt('occurred_at',date+'T23:59:59.999').order('occurred_at',{ascending:true})
  if(error)throw error
  const merged={...local}
  for(const row of data??[])merged[row.activity_id]={status:row.event_type==='declined'?'no':'yes',answeredAt:row.occurred_at}
  writeLocal(childId,merged,date);return merged
 }catch(error){console.warn('Could not load Supabase activity answers. Using local storage.',error);return local}
}

export async function saveActivityAnswer(childId:string,activityId:string,status:ActivityAnswerStatus,answeredAt:string,date=localDateKey()){
 const current=readLocal(childId,date);current[activityId]={status,answeredAt};writeLocal(childId,current,date)
 if(!supabase)return {synced:false}
 try{
  const user=await getSignedInUser();if(!user)return {synced:false}
  const {error}=await supabase.from('activity_events').insert({child_id:childId,activity_id:activityId,event_type:status==='yes'?'completed':'declined',occurred_at:answeredAt,metadata:{activity_date:date,answer:status}})
  if(error)throw error;return {synced:true}
 }catch(error){console.warn('Activity answer saved locally but not synced to Supabase.',error);return {synced:false}}
}
export const saveCompletion=(childId:string,activityId:string,completedAt:string,date=localDateKey())=>saveActivityAnswer(childId,activityId,'yes',completedAt,date)
export const loadTodayCompletions=(childId:string)=>loadCompletions(childId)

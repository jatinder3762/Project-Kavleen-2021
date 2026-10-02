import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityBoard } from './components/ActivityBoard'
import { ChildCalendar } from './components/ChildCalendar'
import { ParentSettingsPage } from './components/ParentSettingsPage'
import { ParentGate } from './components/ParentGate'
import { ParentAuth } from './components/ParentAuth'
import { supabase } from './lib/auth'
import { ProfilePicker } from './components/ProfilePicker'
import { TimerOverlay } from './components/TimerOverlay'
import { loadCompletions, localDateKey, saveActivityAnswer } from './lib/persistence'
import { emptyParentSettings, saveParentSettings } from './lib/settings'
import { loadFamilySettings, saveFamilySettings } from './lib/familyRepository'
import { pickEncouragement, speak } from './lib/speech'
import type { Activity, ChildProfile, CompletionMap, ParentSettings, TimerSession } from './types'

type Screen='loading'|'parent-auth'|'profiles'|'calendar'|'day'|'parent-gate'|'settings'
const timerKey=(childId:string)=>`project-kavleen:timer:${childId}`
const usageKey=(childId:string,activityId:string)=>`project-kavleen:usage:${childId}:${activityId}:${new Date().toISOString().slice(0,10)}`

export default function App(){
 const [screen,setScreen]=useState<Screen>('loading')
 const [settings,setSettings]=useState<ParentSettings>(emptyParentSettings)
 const [selectedChildId,setSelectedChildId]=useState<string|null>(null)
 const [completions,setCompletions]=useState<CompletionMap>({})
 const [completionDays,setCompletionDays]=useState<Record<string,CompletionMap>>({})
 const [selectedDate,setSelectedDate]=useState(localDateKey())
 const [celebration,setCelebration]=useState<{activityId:string;message:string}|null>(null)
 const [timer,setTimer]=useState<TimerSession|null>(null)
 const [saveError,setSaveError]=useState('')
 const celebrationTimer=useRef<number|null>(null)
 const selectedProfile=settings.children.find(c=>c.id===selectedChildId)??null

 const loadSignedInFamily=useCallback(async()=>{
  setScreen('loading');setSaveError('')
  try{
   const remote=await loadFamilySettings()
   if(!remote){setSettings(emptyParentSettings);setScreen('parent-auth');return}
   setSettings(remote);saveParentSettings(remote)
   setScreen(remote.children.length?'profiles':'settings')
  }catch(e){
   console.error(e);setSettings(emptyParentSettings);setScreen('parent-auth')
  }
 },[])

 useEffect(()=>{
  let active=true
  const boot=async()=>{
   if(!supabase){if(active)setScreen('parent-auth');return}
   const {data:{session}}=await supabase.auth.getSession()
   if(!active)return
   if(!session){setScreen('parent-auth');return}
   await loadSignedInFamily()
  }
  void boot()
  return()=>{active=false;if(celebrationTimer.current)window.clearTimeout(celebrationTimer.current)}
 },[loadSignedInFamily])

 const openParent=async()=>{if(!supabase){setScreen('parent-auth');return}const {data:{user}}=await supabase.auth.getUser();setScreen(user?.email?'parent-gate':'parent-auth')}
 const startDay=async(profile:ChildProfile)=>{
  setSelectedChildId(profile.id); const today=localDateKey(); const done=await loadCompletions(profile.id,today); setCompletionDays({[today]:done}); setScreen('calendar')
  try{const raw=localStorage.getItem(timerKey(profile.id)); if(raw){const saved=JSON.parse(raw) as TimerSession;if(new Date(saved.endsAt).getTime()>Date.now())setTimer(saved)}}catch{}
  speak(`Hi ${profile.name}! Pochu is ready. Let's have a happy day!`,settings.voice)
 }
 const openDate=async(date:string)=>{if(!selectedProfile)return;const done=await loadCompletions(selectedProfile.id,date);setSelectedDate(date);setCompletions(done);setCompletionDays(current=>({...current,[date]:done}));setScreen('day')}
 const updateSettings=async(next:ParentSettings)=>{
  setSaveError('')
  try{
   const saved=await saveFamilySettings(next)
   setSettings(saved);saveParentSettings(saved);setScreen(saved.children.length?'profiles':'settings')
  }catch(e){
   console.error(e);setSaveError('Could not save to your family account. Nothing was deleted. Please check the Supabase setup and try again.')
  }
 }
 const answerActivity=useCallback(async(activity:Activity,status:'yes'|'no')=>{
  if(!selectedProfile)return
  const answeredAt=new Date().toISOString()
  setCompletions(current=>({...current,[activity.id]:{status,answeredAt}}))
  if(status==='yes'){
   const message=pickEncouragement();setCelebration({activityId:activity.id,message});speak(message,settings.voice)
   if(celebrationTimer.current)window.clearTimeout(celebrationTimer.current);celebrationTimer.current=window.setTimeout(()=>setCelebration(null),1800)
   const triggered=(selectedProfile.activities??[]).find(a=>a.triggerAfterId===activity.id)
   if(triggered)window.setTimeout(()=>speak(`Next, ${triggered.label}.`,settings.voice),1900)
  }else{
   setCelebration(null);speak('Okay. Pochu says we can try again next time.',settings.voice)
  }
  await saveActivityAnswer(selectedProfile.id,activity.id,status,answeredAt,selectedDate)
 },[selectedProfile,settings.voice,selectedDate])
 const startTimer=(activity:Activity)=>{
  if(!selectedProfile)return
  const requested=Math.max(1,activity.durationMinutes??30)
  const used=Number(localStorage.getItem(usageKey(selectedProfile.id,activity.id))??0)
  const remaining=activity.dailyLimitMinutes ? Math.max(0,activity.dailyLimitMinutes-used) : requested
  if(activity.dailyLimitMinutes && remaining<=0){speak(`Your ${activity.label} time is all used for today.`,settings.voice);window.alert(`${activity.label}: today’s ${activity.dailyLimitMinutes} minute allowance is finished.`);return}
  const duration=Math.min(requested,remaining),startedAt=new Date(),endsAt=new Date(startedAt.getTime()+duration*60000)
  const session={activityId:activity.id,startedAt:startedAt.toISOString(),endsAt:endsAt.toISOString(),durationMinutes:duration}
  localStorage.setItem(timerKey(selectedProfile.id),JSON.stringify(session));setTimer(session);speak(`${activity.label} started for ${duration} minutes.`,settings.voice)
 }
 const finishTimer=useCallback(()=>{if(!selectedProfile||!timer)return;const activity=(selectedProfile.activities??[]).find(a=>a.id===timer.activityId);localStorage.removeItem(timerKey(selectedProfile.id));setTimer(null);if(activity){const key=usageKey(selectedProfile.id,activity.id);localStorage.setItem(key,String(Number(localStorage.getItem(key)??0)+timer.durationMinutes));void answerActivity(activity,'yes')}},[selectedProfile,timer,answerActivity])

 if(screen==='loading')return <main className="pochu-loading"><div className="pochu-loading-bear">🐻</div><strong>POCHU</strong><span>Getting your family ready…</span></main>
 if(screen==='parent-auth')return <ParentAuth onReady={()=>void loadSignedInFamily()}/>
 if(screen==='parent-gate')return <ParentGate onUnlock={()=>setScreen('settings')} onCancel={()=>setScreen('profiles')}/>
 if(screen==='settings')return <>{saveError&&<div className="global-save-error" role="alert">{saveError}</div>}<ParentSettingsPage settings={settings} onSave={updateSettings} onCancel={()=>setScreen(settings.children.length?'profiles':'settings')}/></>
 if(screen==='profiles'||!selectedProfile)return <ProfilePicker profiles={settings.children} onSelect={startDay} onOpenSettings={()=>void openParent()}/>
 if(screen==='calendar')return <ChildCalendar profile={selectedProfile} completionDays={completionDays} onSelectDate={openDate} onBack={()=>setScreen('profiles')} onSettings={()=>void openParent()}/>
 const timerActivity=timer?(selectedProfile.activities??[]).find(a=>a.id===timer.activityId):undefined
 return <><ActivityBoard profile={selectedProfile} completions={completions} celebration={celebration} onAnswer={answerActivity} onStartTimer={startTimer} selectedDate={selectedDate} onBack={()=>setScreen('calendar')} onSettings={()=>void openParent()}/>
  {timer&&timerActivity&&<TimerOverlay activity={timerActivity} session={timer} voice={settings.voice} onFinish={finishTimer} onClose={()=>setTimer(null)}/>}</>
}

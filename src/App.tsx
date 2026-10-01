import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityBoard } from './components/ActivityBoard'
import { ParentSettingsPage } from './components/ParentSettingsPage'
import { ProfilePicker } from './components/ProfilePicker'
import { TimerOverlay } from './components/TimerOverlay'
import { loadTodayCompletions, saveCompletion } from './lib/persistence'
import { loadParentSettings, saveParentSettings } from './lib/settings'
import { pickEncouragement, speak } from './lib/speech'
import type { Activity, ChildProfile, CompletionMap, ParentSettings, TimerSession } from './types'

type Screen='profiles'|'day'|'settings'
const timerKey=(childId:string)=>`project-kavleen:timer:${childId}`

export default function App(){
 const [screen,setScreen]=useState<Screen>('profiles')
 const [settings,setSettings]=useState<ParentSettings>(()=>loadParentSettings())
 const [selectedChildId,setSelectedChildId]=useState<string|null>(null)
 const [completions,setCompletions]=useState<CompletionMap>({})
 const [celebration,setCelebration]=useState<{activityId:string;message:string}|null>(null)
 const [timer,setTimer]=useState<TimerSession|null>(null)
 const celebrationTimer=useRef<number|null>(null)
 const selectedProfile=settings.children.find(c=>c.id===selectedChildId)??null

 useEffect(()=>()=>{if(celebrationTimer.current)window.clearTimeout(celebrationTimer.current)},[])
 const startDay=async(profile:ChildProfile)=>{
  setSelectedChildId(profile.id); setCompletions(await loadTodayCompletions(profile.id)); setScreen('day')
  try{const raw=localStorage.getItem(timerKey(profile.id)); if(raw){const saved=JSON.parse(raw) as TimerSession;if(new Date(saved.endsAt).getTime()>Date.now())setTimer(saved)}}catch{}
  speak(`Hi ${profile.name}! Let's have a happy day!`,settings.voice)
 }
 const updateSettings=(next:ParentSettings)=>{setSettings(next);saveParentSettings(next);setScreen('profiles')}
 const completeActivity=useCallback(async(activity:Activity)=>{
  if(!selectedProfile)return
  if(completions[activity.id]&&activity.type!=='recurring'){speak('Already done! Great job!',settings.voice);return}
  const completedAt=new Date().toISOString(),message=pickEncouragement()
  setCompletions(current=>({...current,[activity.id]:completedAt}));setCelebration({activityId:activity.id,message});speak(message,settings.voice)
  if(celebrationTimer.current)window.clearTimeout(celebrationTimer.current);celebrationTimer.current=window.setTimeout(()=>setCelebration(null),1800)
  await saveCompletion(selectedProfile.id,activity.id,completedAt)
  const triggered=(selectedProfile.activities??[]).find(a=>a.triggerAfterId===activity.id)
  if(triggered)window.setTimeout(()=>speak(`Next, ${triggered.label}.`,settings.voice),1900)
 },[selectedProfile,completions,settings.voice])
 const startTimer=(activity:Activity)=>{
  if(!selectedProfile)return
  const duration=Math.max(1,activity.durationMinutes??30),startedAt=new Date(),endsAt=new Date(startedAt.getTime()+duration*60000)
  const session={activityId:activity.id,startedAt:startedAt.toISOString(),endsAt:endsAt.toISOString(),durationMinutes:duration}
  localStorage.setItem(timerKey(selectedProfile.id),JSON.stringify(session));setTimer(session);speak(`${activity.label} started for ${duration} minutes.`,settings.voice)
 }
 const finishTimer=useCallback(()=>{if(!selectedProfile||!timer)return;const activity=(selectedProfile.activities??[]).find(a=>a.id===timer.activityId);localStorage.removeItem(timerKey(selectedProfile.id));if(activity)void completeActivity(activity)},[selectedProfile,timer,completeActivity])

 if(screen==='settings')return <ParentSettingsPage settings={settings} onSave={updateSettings} onCancel={()=>setScreen('profiles')}/>
 if(screen==='profiles'||!selectedProfile)return <ProfilePicker profiles={settings.children} onSelect={startDay} onOpenSettings={()=>setScreen('settings')}/>
 const timerActivity=timer?(selectedProfile.activities??[]).find(a=>a.id===timer.activityId):undefined
 return <><ActivityBoard profile={selectedProfile} completions={completions} celebration={celebration} onComplete={completeActivity} onStartTimer={startTimer} onBack={()=>setScreen('profiles')}/>
  {timer&&timerActivity&&<TimerOverlay activity={timerActivity} session={timer} voice={settings.voice} onFinish={finishTimer} onClose={()=>setTimer(null)}/>}</>
}

import { useEffect, useState } from 'react'
import { speak } from '../lib/speech'
import type { VoiceSettings } from '../types'
import type { Activity, ChildProfile, CompletionMap } from '../types'
import { ActivityCard } from './ActivityCard'

type Props = {
  profile: ChildProfile; completions: CompletionMap; celebration: { activityId: string; message: string } | null
  onComplete: (activity: Activity) => void; onStartTimer: (activity: Activity) => void; selectedDate:string; onBack: () => void; onSettings:()=>void; onFunGames:()=>void; voice:VoiceSettings
}

export function ActivityBoard({ profile, completions, celebration, onComplete, onStartTimer, selectedDate, onBack, onSettings, onFunGames, voice }: Props) {
  const [pending,setPending]=useState<Activity|null>(null)
  const [feedback,setFeedback]=useState('')
  const question=(activity:Activity)=>{
    const name=activity.label.toLowerCase()
    if(/wash.*hand|hand.*wash/.test(name))return 'Hi! Did you wash your hands?'
    if(/drink.*water|water/.test(name))return 'Hi! Did you drink your water?'
    if(/homework/.test(name))return 'Hi! Did you finish your homework?'
    if(/brush.*teeth|teeth/.test(name))return 'Hi! Did you brush your teeth?'
    if(/bath|shower/.test(name))return 'Hi! Did you take your bath?'
    if(/read|book/.test(name))return 'Hi! Did you finish your reading?'
    if(/toy|clean|tidy/.test(name))return 'Hi! Did you clean up your toys?'
    return 'Hi! Did you finish '+activity.label.toLowerCase().replace(/[?.!]+$/,'')+'?'
  }
  const ask=(activity:Activity)=>{
    setPending(activity);setFeedback('');speak(question(activity),voice)
  }
  const answer=(yes:boolean)=>{
    if(!pending)return
    if(yes){
      if(pending.type==='timed'){onStartTimer(pending);setPending(null);return}
      onComplete(pending)
      setFeedback('🌟 Amazing job! You did it!')
    }else{
      setFeedback('💛 That is okay! You can do it when you are ready.')
      speak('That is okay! You can do it when you are ready.',voice)
    }
  }
  useEffect(()=>{setPending(null);setFeedback('')},[selectedDate,profile.id])
  const sections=(profile.sections ?? []).slice().sort((a,b)=>a.order-b.order)
  const activities=profile.activities ?? []
  const chosen=new Date(selectedDate+'T12:00:00'), day=chosen.getDay(), today=new Date(); today.setHours(0,0,0,0); const readOnly=chosen.getTime()<today.getTime()
  const visible=activities.filter(a=>a.enabled!==false && (profile.scheduleDates?.[selectedDate]?profile.scheduleDates[selectedDate].includes(a.id):(!a.days?.length || a.days.includes(day))) && (a.type!=='triggered' || !a.triggerAfterId || Boolean(completions[a.triggerAfterId])))
  const completeCount=visible.filter(a=>Boolean(completions[a.id])).length
  return <main className="day-screen"><nav className="screen-nav"><button onClick={onBack}>← Calendar</button><button type="button" className="save-settings-button" onClick={onFunGames}>🎮 Fun Games</button><button onClick={onSettings}>⚙️ Settings</button></nav>
    <header className="day-header">
      <button className="mini-profile" type="button" onClick={onBack} aria-label="Choose profile">{profile.photoDataUrl?<img src={profile.photoDataUrl} alt=""/>:<span aria-hidden="true">{profile.emoji}</span>}</button>
      <div className="day-title"><span className="day-title-icon" aria-hidden="true">🌈</span><div><h1>My Happy Day</h1><p>{profile.name} · {new Date(selectedDate+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}</p></div></div>
      <div className="star-counter" aria-label={`${completeCount} activities completed`}>⭐ <strong>{completeCount}</strong></div>
    </header>
    {readOnly&&<div className="history-banner">🔒 Past day · child view is read-only</div>}<div className="progress-track" aria-hidden="true"><div className="progress-fill" style={{width:`${visible.length?Math.min(100,completeCount/visible.length*100):0}%`}}/></div>
    <div className="sections">{sections.map(section=>{
      const list=visible.filter(a=>a.sectionId===section.id).sort((a,b)=>a.order-b.order)
      if(!list.length) return null
      return <section className="day-section" key={section.id}><h2><span aria-hidden="true">{section.icon}</span><span>{section.label}</span></h2>
        <div className="activity-grid">{list.map(activity=><ActivityCard key={activity.id} activity={activity} completedAt={completions[activity.id]}
          celebrating={celebration?.activityId===activity.id} message={celebration?.activityId===activity.id?celebration.message:undefined}
          readOnly={readOnly} onComplete={ask} onStartTimer={ask}/>)}</div>
      </section>
    })}</div>
    {pending&&<div className="child-modal-backdrop" role="presentation"><section className="child-modal" role="dialog" aria-modal="true" aria-labelledby="activity-confirm-title" style={{textAlign:'center'}}>
      <div style={{fontSize:'4rem'}} aria-hidden="true">{pending.emoji}</div>
      <h2 id="activity-confirm-title">{feedback||question(pending)}</h2>
      {!feedback?<div className="child-modal-actions" style={{justifyContent:'center',gap:'1rem',flexWrap:'wrap'}}>
        <button type="button" className="save-settings-button" onClick={()=>answer(true)}>✅ Yes!</button>
        <button type="button" className="secondary-button" onClick={()=>answer(false)}>💛 Not Yet</button>
      </div>:<button type="button" className="save-settings-button" onClick={()=>{setPending(null);setFeedback('')}}>Continue 🌈</button>}
      {!feedback&&<button type="button" className="secondary-button" style={{marginTop:'1rem'}} onClick={()=>{setPending(null);setFeedback('')}}>Close</button>}
    </section></div>}
  </main>
}

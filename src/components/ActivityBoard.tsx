import type { Activity, ChildProfile, CompletionMap } from '../types'
import { ActivityCard } from './ActivityCard'
type Props={profile:ChildProfile;completions:CompletionMap;celebration:{activityId:string;message:string}|null;onAnswer:(activity:Activity,status:'yes'|'no')=>void;onStartTimer:(activity:Activity)=>void;selectedDate:string;onBack:()=>void;onSettings:()=>void}
export function ActivityBoard({profile,completions,celebration,onAnswer,onStartTimer,selectedDate,onBack,onSettings}:Props){
 const sections=(profile.sections??[]).slice().sort((a,b)=>a.order-b.order),activities=profile.activities??[]
 const chosen=new Date(selectedDate+'T12:00:00'),day=chosen.getDay(),today=new Date();today.setHours(0,0,0,0);const chosenDay=new Date(chosen);chosenDay.setHours(0,0,0,0);const readOnly=chosenDay.getTime()!==today.getTime()
 const visible=activities.filter(a=>a.enabled!==false&&(!a.days?.length||a.days.includes(day))&&(a.type!=='triggered'||!a.triggerAfterId||completions[a.triggerAfterId]?.status==='yes'))
 const yesCount=visible.filter(a=>completions[a.id]?.status==='yes').length,answeredCount=visible.filter(a=>Boolean(completions[a.id])).length
 return <main className="day-screen"><nav className="screen-nav"><button onClick={onBack}>← Calendar</button><button onClick={onSettings}>⚙️ Settings</button></nav>
  <header className="day-header"><button className="mini-profile" type="button" onClick={onBack} aria-label="Choose profile">{profile.photoDataUrl?<img src={profile.photoDataUrl} alt=""/>:<span aria-hidden="true">{profile.emoji}</span>}</button><div className="day-title"><span className="day-title-icon" aria-hidden="true">🐻</span><div><h1>Pochu & My Day</h1><p>{profile.name} · {chosen.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}</p></div></div><div className="star-counter" aria-label={`${yesCount} yes answers`}>⭐ <strong>{yesCount}</strong></div></header>
  {readOnly&&<div className="history-banner">🔒 {chosenDay<today?'Past':'Future'} day · child view is read-only</div>}
  {!readOnly&&<div className="swipe-guide">🐻 Swipe <strong>right for YES</strong> or <strong>left for NO</strong>. Buttons work too.</div>}
  <div className="progress-track" aria-hidden="true"><div className="progress-fill" style={{width:`${visible.length?Math.min(100,answeredCount/visible.length*100):0}%`}}/></div>
  <div className="sections">{sections.map(section=>{const list=visible.filter(a=>a.sectionId===section.id).sort((a,b)=>a.order-b.order);if(!list.length)return null;return <section className="day-section" key={section.id}><h2><span aria-hidden="true">{section.icon}</span><span>{section.label}</span></h2><div className="activity-grid">{list.map(activity=><ActivityCard key={activity.id} activity={activity} answer={completions[activity.id]} celebrating={celebration?.activityId===activity.id} message={celebration?.activityId===activity.id?celebration.message:undefined} readOnly={readOnly} onAnswer={onAnswer} onStartTimer={onStartTimer}/>)}</div></section>})}</div>
 </main>
}

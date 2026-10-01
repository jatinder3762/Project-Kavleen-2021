import type { Activity, ChildProfile, CompletionMap } from '../types'
import { ActivityCard } from './ActivityCard'

type Props = {
  profile: ChildProfile; completions: CompletionMap; celebration: { activityId: string; message: string } | null
  onComplete: (activity: Activity) => void; onStartTimer: (activity: Activity) => void; onBack: () => void
}

export function ActivityBoard({ profile, completions, celebration, onComplete, onStartTimer, onBack }: Props) {
  const sections=(profile.sections ?? []).slice().sort((a,b)=>a.order-b.order)
  const activities=profile.activities ?? []
  const visible=activities.filter(a=>a.enabled!==false)
  const completeCount=visible.filter(a=>Boolean(completions[a.id])).length
  return <main className="day-screen">
    <header className="day-header">
      <button className="mini-profile" type="button" onClick={onBack} aria-label="Choose profile">{profile.photoDataUrl?<img src={profile.photoDataUrl} alt=""/>:<span aria-hidden="true">{profile.emoji}</span>}</button>
      <div className="day-title"><span className="day-title-icon" aria-hidden="true">🌈</span><div><h1>My Happy Day</h1><p>{profile.name}</p></div></div>
      <div className="star-counter" aria-label={`${completeCount} activities completed`}>⭐ <strong>{completeCount}</strong></div>
    </header>
    <div className="progress-track" aria-hidden="true"><div className="progress-fill" style={{width:`${visible.length?Math.min(100,completeCount/visible.length*100):0}%`}}/></div>
    <div className="sections">{sections.map(section=>{
      const list=visible.filter(a=>a.sectionId===section.id).sort((a,b)=>a.order-b.order)
      if(!list.length) return null
      return <section className="day-section" key={section.id}><h2><span aria-hidden="true">{section.icon}</span><span>{section.label}</span></h2>
        <div className="activity-grid">{list.map(activity=><ActivityCard key={activity.id} activity={activity} completedAt={completions[activity.id]}
          celebrating={celebration?.activityId===activity.id} message={celebration?.activityId===activity.id?celebration.message:undefined}
          onComplete={onComplete} onStartTimer={onStartTimer}/>)}</div>
      </section>
    })}</div>
  </main>
}

import type { Activity, ChildProfile } from '../types'
type Props={profile:ChildProfile;date:string;onSave:(ids:string[])=>void;onCancel:()=>void}
export function ScheduleEditor({profile,date,onSave,onCancel}:Props){
 const chosen=new Date(date+'T12:00:00')
 const weekday=chosen.getDay()
 const activities=(profile.activities??[]).filter(a=>a.enabled!==false)
 const defaults=activities.filter(a=>!a.days?.length||a.days.includes(weekday)).map(a=>a.id)
 const existing=profile.scheduleDates?.[date]
 const selected=new Set(existing??defaults)
 return <main className="day-screen"><nav className="screen-nav"><button type="button" onClick={onCancel}>← Calendar</button></nav>
 <header className="day-header"><div className="day-title"><span className="day-title-icon">🗓️</span><div><h1>Plan activities</h1><p>{profile.name} · {chosen.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</p></div></div></header>
 <p>Choose activities for this date. Save to your family account.</p>
 <form onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget);onSave(activities.filter(a=>form.has(a.id)).map(a=>a.id))}}>
 <div className="activity-grid">{activities.map((a:Activity)=><label key={a.id} className="activity-card" style={{padding:'1rem',display:'flex',gap:'1rem',alignItems:'center',cursor:'pointer'}}><input type="checkbox" name={a.id} defaultChecked={selected.has(a.id)}/><span style={{fontSize:'2rem'}}>{a.emoji}</span><strong>{a.label}</strong></label>)}</div>
 {!activities.length&&<p>No activities yet. Add activities in Parent Settings → Routine Builder first.</p>}
 <div className="settings-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button><button className="save-settings-button" type="submit">✓ Save this day</button></div></form></main>
}

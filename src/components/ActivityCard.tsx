import type { Activity } from '../types'
type Props={activity:Activity;completedAt?:string;celebrating:boolean;message?:string;readOnly?:boolean;onComplete:(a:Activity)=>void;onStartTimer:(a:Activity)=>void}
export function ActivityCard({activity,completedAt,celebrating,message,readOnly=false,onComplete,onStartTimer}:Props){
 const completed=Boolean(completedAt), timed=activity.type==='timed'
 return <article className={['activity-card',completed?'is-complete':'',celebrating?'is-celebrating':''].filter(Boolean).join(' ')}>
  <button type="button" className="activity-main-button" disabled={readOnly} onClick={()=>timed?onStartTimer(activity):onComplete(activity)} aria-label={`${activity.label}${completed?', completed':''}`}>
   <span className="activity-visual" aria-hidden="true">{activity.emoji}</span><span className="activity-label">{activity.label}</span>
   {activity.scheduleTime&&<span className="activity-meta">🕒 {activity.scheduleTime}</span>}
   {timed&&<span className="activity-meta">⏱️ {activity.durationMinutes ?? 30} min</span>}
   {activity.type==='recurring'&&<span className="activity-meta">🔁 Repeat</span>}
   {activity.type==='triggered'&&<span className="activity-meta">🔗 Next step</span>}
   {readOnly&&!completed&&<span className="activity-meta">○ Missed</span>}
   <span className="check-bubble" aria-hidden="true">{completed?'✓':''}</span>
  </button>
  {celebrating&&<><span className="celebration-message">{message}</span><span className="burst burst-one">⭐</span><span className="burst burst-two">✨</span></>}
 </article>
}

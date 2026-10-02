import { useRef, useState } from 'react'
import type { Activity, ActivityAnswer } from '../types'
type Props={activity:Activity;answer?:ActivityAnswer;celebrating:boolean;message?:string;readOnly?:boolean;onAnswer:(a:Activity,status:'yes'|'no')=>void;onStartTimer:(a:Activity)=>void}
export function ActivityCard({activity,answer,celebrating,message,readOnly=false,onAnswer,onStartTimer}:Props){
 const timed=activity.type==='timed',startX=useRef<number|null>(null),[drag,setDrag]=useState(0)
 const yes=answer?.status==='yes',no=answer?.status==='no'
 const down=(x:number)=>{if(!readOnly)startX.current=x}
 const move=(x:number)=>{if(startX.current!==null)setDrag(Math.max(-90,Math.min(90,x-startX.current)))}
 const end=()=>{if(startX.current===null)return;const distance=drag;startX.current=null;setDrag(0);if(distance>48)onAnswer(activity,'yes');else if(distance< -48)onAnswer(activity,'no')}
 return <article className={['activity-card',yes?'is-complete':'',no?'is-declined':'',celebrating?'is-celebrating':''].filter(Boolean).join(' ')}>
  {!readOnly&&<div className="swipe-hints" aria-hidden="true"><span>← NO</span><span>YES →</span></div>}
  <div className="activity-swipe-layer" style={{transform:`translateX(${drag}px)`}} onPointerDown={e=>down(e.clientX)} onPointerMove={e=>{if(startX.current!==null){e.currentTarget.setPointerCapture(e.pointerId);move(e.clientX)}}} onPointerUp={end} onPointerCancel={()=>{startX.current=null;setDrag(0)}}>
   <button type="button" className="activity-main-button" disabled={readOnly} onClick={()=>{if(Math.abs(drag)>8)return;if(timed&&!answer)onStartTimer(activity)}} aria-label={`${activity.label}${answer?', '+answer.status:''}`}>
    <span className="activity-visual" aria-hidden="true">{activity.emoji}</span><span className="activity-label">{activity.label}</span>
    {activity.scheduleTime&&<span className="activity-meta">🕒 {activity.scheduleTime}</span>}{timed&&<span className="activity-meta">⏱️ {activity.durationMinutes??30} min</span>}
    {activity.type==='recurring'&&<span className="activity-meta">🔁 Repeat</span>}{activity.type==='triggered'&&<span className="activity-meta">🔗 Next step</span>}
    {readOnly&&!answer&&<span className="activity-meta">○ No answer</span>}
    <span className="check-bubble" aria-hidden="true">{yes?'✓':no?'✕':''}</span>
   </button>
  </div>
  {!readOnly&&<div className="answer-buttons"><button type="button" className="answer-no" onClick={()=>onAnswer(activity,'no')} aria-label={`No, ${activity.label}`}>✕ No</button><button type="button" className="answer-yes" onClick={()=>onAnswer(activity,'yes')} aria-label={`Yes, ${activity.label}`}>✓ Yes</button></div>}
  {celebrating&&<><span className="pochu-reaction" aria-hidden="true">🐻👍</span><span className="celebration-message">{message}</span><span className="burst burst-one">⭐</span><span className="burst burst-two">✨</span></>}
  {no&&<span className="pochu-no-reaction" aria-label="Pochu says okay, maybe next time">🐻💛</span>}
 </article>
}

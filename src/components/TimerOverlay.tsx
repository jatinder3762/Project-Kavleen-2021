import { useEffect, useMemo, useRef, useState } from 'react'
import type { Activity, TimerSession, VoiceSettings } from '../types'
import { speak } from '../lib/speech'

type Props = { activity: Activity; session: TimerSession; voice: VoiceSettings; onFinish: () => void; onClose: () => void }

export function TimerOverlay({ activity, session, voice, onFinish, onClose }: Props) {
  const [now, setNow] = useState(Date.now())
  const warned = useRef(new Set<number>())
  const end = useMemo(()=>new Date(session.endsAt).getTime(),[session.endsAt])
  const remaining = Math.max(0, Math.ceil((end-now)/1000))
  const total = Math.max(1, session.durationMinutes*60)
  const progress = Math.max(0, Math.min(100, remaining/total*100))

  useEffect(()=>{ const id=window.setInterval(()=>setNow(Date.now()),500); return ()=>window.clearInterval(id) },[])
  useEffect(()=>{
    const mins=Math.ceil(remaining/60)
    for(const warning of activity.reminderMinutes ?? [5,1]) if(mins===warning && remaining>0 && !warned.current.has(warning)){ warned.current.add(warning); speak(`${warning} minute${warning===1?'':'s'} left for ${activity.label}.`,voice) }
    if(remaining===0){ speak(`${activity.label} is finished. Great job stopping on time!`,voice); onFinish() }
  },[remaining,activity,voice,onFinish])
  const mm=String(Math.floor(remaining/60)).padStart(2,'0'), ss=String(remaining%60).padStart(2,'0')
  return <div className="timer-overlay" role="dialog" aria-modal="true" aria-label={activity.label}>
    <div className="timer-card">
      <span className="timer-emoji">{activity.emoji}</span><h2>{activity.label}</h2>
      <div className="timer-ring" style={{background:`conic-gradient(#6157d8 ${progress}%, #ece9f7 0)`}}><div><strong>{mm}:{ss}</strong><span>remaining</span></div></div>
      <p>{remaining ? 'Enjoy your time. I’ll tell you when it is nearly finished.' : 'Time is finished! ⭐'}</p>
      <button type="button" className="secondary-button" onClick={onClose}>{remaining ? 'Hide timer' : 'Done'}</button>
    </div>
  </div>
}

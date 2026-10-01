import { useState } from 'react'
import type { Activity, ChildProfile, RoutineSection } from '../types'

type Props = { child: ChildProfile; onChange: (child: ChildProfile) => void }

const library = [
  ['🧼','Wash hands','recurring'], ['📺','TV time','timed'], ['📱','Tablet time','timed'],
  ['🍎','Snack','normal'], ['📚','Homework','normal'], ['🛝','Play','normal'],
  ['🥤','Drink water','recurring'], ['📖','Reading','timed'], ['🧹','Tidy up','normal'],
] as const

export function RoutineBuilder({ child, onChange }: Props) {
  const sections = child.sections ?? []
  const activities = child.activities ?? []
  const [editing, setEditing] = useState<string | null>(null)

  const commit = (next: Activity[]) => onChange({ ...child, activities: next })
  const update = (id: string, patch: Partial<Activity>) => commit(activities.map(a => a.id === id ? { ...a, ...patch } : a))
  const remove = (id: string) => commit(activities.filter(a => a.id !== id))
  const move = (activity: Activity, sectionId: string, order: number) => {
    const without = activities.filter(a => a.id !== activity.id)
    const target = without.filter(a => a.sectionId === sectionId).sort((a,b) => a.order-b.order)
    target.splice(Math.max(0, Math.min(order, target.length)), 0, { ...activity, sectionId })
    const normalized = without.filter(a => a.sectionId !== sectionId)
      .concat(target.map((a,i) => ({ ...a, order: i })))
    commit(normalized)
  }
  const add = (emoji: string, label: string, type: Activity['type']) => {
    const sectionId = sections[0]?.id ?? 'morning'
    const id = `activity-${Date.now()}-${Math.random().toString(36).slice(2,6)}`
    commit([...activities, { id, emoji, label, type, sectionId, order: activities.filter(a => a.sectionId === sectionId).length, ...(type === 'timed' ? { durationMinutes: 30, reminderMinutes: [5,1] } : {}) }])
    setEditing(id)
  }
  const addSection = () => {
    const id = `section-${Date.now()}`
    const next: RoutineSection = { id, label: 'New section', icon: '⭐', order: sections.length }
    onChange({ ...child, sections: [...sections, next] })
  }
  const updateSection = (id: string, patch: Partial<RoutineSection>) => onChange({ ...child, sections: sections.map(s => s.id === id ? { ...s, ...patch } : s) })

  return <div className="routine-builder">
    <div className="routine-library">
      <div><h3>Activity library</h3><p>Tap to add, then drag into the right part of the day.</p></div>
      <div className="library-chips">{library.map(([emoji,label,type]) =>
        <button type="button" key={label} onClick={() => add(emoji,label,type)}>{emoji} {label}</button>
      )}</div>
    </div>

    <div className="routine-columns">
      {sections.slice().sort((a,b)=>a.order-b.order).map(section => {
        const list = activities.filter(a => a.sectionId === section.id && a.enabled !== false).sort((a,b)=>a.order-b.order)
        return <section className="routine-column" key={section.id}
          onDragOver={e=>e.preventDefault()}
          onDrop={e=>{ const id=e.dataTransfer.getData('text/activity-id'); const item=activities.find(a=>a.id===id); if(item) move(item,section.id,list.length) }}>
          <div className="routine-section-title">
            <input aria-label="Section icon" value={section.icon} onChange={e=>updateSection(section.id,{icon:e.target.value.slice(0,4)})}/>
            <input aria-label="Section name" value={section.label} onChange={e=>updateSection(section.id,{label:e.target.value})}/>
          </div>
          <div className="routine-dropzone">
            {list.map((activity,index) => <div className="routine-card" key={activity.id} draggable
              onDragStart={e=>e.dataTransfer.setData('text/activity-id',activity.id)}>
              <button type="button" className="drag-handle" aria-label={`Move ${activity.label}`}>☰</button>
              <span className="routine-emoji">{activity.emoji}</span>
              <button type="button" className="routine-card-main" onClick={()=>setEditing(editing===activity.id?null:activity.id)}>
                <strong>{activity.label}</strong><small>{activity.type}{activity.durationMinutes ? ` · ${activity.durationMinutes} min` : ''}{activity.scheduleTime ? ` · ${activity.scheduleTime}` : ''}</small>
              </button>
              <div className="move-buttons">
                <button type="button" aria-label="Move up" disabled={index===0} onClick={()=>move(activity,section.id,index-1)}>↑</button>
                <button type="button" aria-label="Move down" disabled={index===list.length-1} onClick={()=>move(activity,section.id,index+1)}>↓</button>
              </div>
              {editing===activity.id && <div className="activity-editor">
                <label>Name<input value={activity.label} onChange={e=>update(activity.id,{label:e.target.value})}/></label>
                <label>Type<select value={activity.type} onChange={e=>update(activity.id,{type:e.target.value as Activity['type']})}>
                  <option value="normal">Normal</option><option value="recurring">Recurring</option><option value="timed">Timed</option><option value="scheduled">Scheduled</option><option value="triggered">Triggered</option><option value="checklist">Checklist</option>
                </select></label>
                {(activity.type==='timed') && <><label>Session minutes<input type="number" min="1" max="240" value={activity.durationMinutes ?? 30} onChange={e=>update(activity.id,{durationMinutes:Number(e.target.value)})}/></label>
                <label>Daily limit<input type="number" min="1" max="600" value={activity.dailyLimitMinutes ?? ''} onChange={e=>update(activity.id,{dailyLimitMinutes:e.target.value?Number(e.target.value):undefined})}/></label></>}
                {(activity.type==='scheduled') && <label>Time<input type="time" value={activity.scheduleTime ?? ''} onChange={e=>update(activity.id,{scheduleTime:e.target.value})}/></label>}
                {(activity.type==='triggered') && <label>Show after<select value={activity.triggerAfterId ?? ''} onChange={e=>update(activity.id,{triggerAfterId:e.target.value})}><option value="">Choose activity</option>{activities.filter(a=>a.id!==activity.id).map(a=><option value={a.id} key={a.id}>{a.label}</option>)}</select></label>}
                <button type="button" className="remove-child-button" onClick={()=>remove(activity.id)}>Remove activity</button>
              </div>}
            </div>)}
            {!list.length && <p className="empty-routine">Drop activities here</p>}
          </div>
        </section>
      })}
      <button type="button" className="add-section-card" onClick={addSection}>＋ Add section</button>
    </div>
  </div>
}

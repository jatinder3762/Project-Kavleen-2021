import { useEffect, useState } from 'react'
import { createChildProfile } from '../lib/settings'
import { getEnglishVoices, speak } from '../lib/speech'
import type { ChildProfile, ParentSettings } from '../types'
import { RoutineBuilder } from './RoutineBuilder'

type Props={settings:ParentSettings;onSave:(s:ParentSettings)=>void;onCancel:()=>void}
export function ParentSettingsPage({settings,onSave,onCancel}:Props){
 const [draft,setDraft]=useState<ParentSettings>(()=>structuredClone(settings))
 const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([])
 const [routineChildId,setRoutineChildId]=useState(settings.children[0]?.id??'')
 useEffect(()=>{const refresh=()=>setVoices(getEnglishVoices());refresh();window.speechSynthesis?.addEventListener('voiceschanged',refresh);return()=>window.speechSynthesis?.removeEventListener('voiceschanged',refresh)},[])
 const updateChild=(id:string,patch:Partial<ChildProfile>)=>setDraft(c=>({...c,children:c.children.map(x=>x.id===id?{...x,...patch}:x)}))
 const replaceChild=(next:ChildProfile)=>setDraft(c=>({...c,children:c.children.map(x=>x.id===next.id?next:x)}))
 const addChild=()=>{const child=createChildProfile(draft.children.length+1);setDraft(c=>({...c,children:[...c.children,child]}));setRoutineChildId(child.id)}
 const removeChild=(id:string)=>setDraft(c=>({...c,children:c.children.filter(x=>x.id!==id)}))
 const choosePhoto=(id:string,file?:File)=>{if(!file||!file.type.startsWith('image/'))return;if(file.size>3*1024*1024){alert('Please choose a picture smaller than 3 MB.');return}const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'&&updateChild(id,{photoDataUrl:reader.result});reader.readAsDataURL(file)}
 const routineChild=draft.children.find(c=>c.id===routineChildId)??draft.children[0]
 return <main className="parent-settings-screen"><div className="parent-settings-shell">
  <header className="parent-settings-header"><button className="secondary-button" type="button" onClick={onCancel}>← Back</button><div><span className="parent-eyebrow">🔒 Parent area</span><h1>Family & routines</h1></div></header>
  <section className="settings-panel"><div className="settings-panel-heading"><div><span className="settings-icon">👧🧒</span><h2>Children</h2><p>Each child has their own routine and screen-time settings.</p></div><button className="add-child-button" type="button" onClick={addChild}>＋ Add child</button></div>
   <div className="child-settings-list">{draft.children.map(child=><article className="child-settings-card" key={child.id}>
    <label className="child-photo-editor"><span className="child-photo-preview">{child.photoDataUrl?<img src={child.photoDataUrl} alt=""/>:<span>{child.emoji}</span>}</span><span className="photo-edit-label">📷 Change photo</span><input className="visually-hidden" type="file" accept="image/*" onChange={e=>choosePhoto(child.id,e.target.files?.[0])}/></label>
    <div className="child-settings-fields"><label><span>Child’s name</span><input value={child.name} maxLength={30} onChange={e=>updateChild(child.id,{name:e.target.value})}/></label>
     <label><span>Avatar</span><select value={child.emoji} onChange={e=>updateChild(child.id,{emoji:e.target.value})}><option>👧</option><option>👦</option><option>🧒</option><option>🐰</option><option>🦄</option><option>🐻</option></select></label>
     <button className="test-voice-button" type="button" onClick={()=>setRoutineChildId(child.id)}>🗓️ Edit {child.name || 'child'}’s routine</button>
     {<button className="remove-child-button" type="button" onClick={()=>removeChild(child.id)}>Remove child</button>}
    </div></article>)}</div>
  </section>
  {routineChild&&<section className="settings-panel routine-panel"><div className="settings-panel-heading"><div><span className="settings-icon">🗓️</span><h2>{routineChild.name}’s Routine Builder</h2><p>Drag activities between sections, use ↑/↓ on touch devices, and tap a card to configure timers or triggers.</p></div></div><RoutineBuilder child={routineChild} onChange={replaceChild}/></section>}
  <section className="settings-panel"><div className="settings-panel-heading"><div><span className="settings-icon">🔊</span><h2>Voice & encouragement</h2><p>Choose the voice children hear for encouragement and timer warnings.</p></div></div>
   <div className="voice-settings-grid"><label className="toggle-row"><span><strong>Spoken encouragement</strong><small>Positive messages and timer warnings.</small></span><input type="checkbox" checked={draft.voice.enabled} onChange={e=>setDraft(c=>({...c,voice:{...c.voice,enabled:e.target.checked}}))}/></label>
    <label><span>Voice</span><select value={draft.voice.voiceURI} onChange={e=>setDraft(c=>({...c,voice:{...c.voice,voiceURI:e.target.value}}))}><option value="">Automatic female voice</option>{voices.map(v=><option value={v.voiceURI} key={v.voiceURI}>{v.name} ({v.lang})</option>)}</select></label>
    <label><span>Speaking speed</span><input type="range" min=".7" max="1.15" step=".05" value={draft.voice.rate} onChange={e=>setDraft(c=>({...c,voice:{...c.voice,rate:Number(e.target.value)}}))}/></label>
    <button className="test-voice-button" type="button" disabled={!draft.voice.enabled} onClick={()=>speak('Great job! You did it!',draft.voice)}>▶️ Test voice</button>
   </div>
  </section>
  <div className="settings-actions"><button className="secondary-button" type="button" onClick={onCancel}>Cancel</button><button className="save-settings-button" type="button" onClick={()=>onSave({...draft,children:draft.children.map(c=>({...c,name:c.name.trim()||'My Child'}))})}>✓ Save settings</button></div>
 </div></main>
}

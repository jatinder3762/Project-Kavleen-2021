import { useEffect, useState } from 'react'
import { createChildProfile } from '../lib/settings'
import { getEnglishVoices, speak } from '../lib/speech'
import type { ChildProfile, ParentSettings } from '../types'
import { RoutineBuilder } from './RoutineBuilder'

type Props={settings:ParentSettings;onSave:(s:ParentSettings)=>void;onCancel:()=>void}
const normalizedName=(name:string)=>name.trim().replace(/\s+/g,' ').toLocaleLowerCase()
const childError=(child:ChildProfile,children:ChildProfile[],selfId?:string)=>{
 const name=child.name.trim().replace(/\s+/g,' ')
 if(!name)return 'Please enter the child’s name.'
 if(name.length<2)return 'Child’s name must be at least 2 characters.'
 if(!child.dateOfBirth)return 'Please enter the child’s date of birth.'
 const dob=new Date(child.dateOfBirth+'T00:00:00')
 if(Number.isNaN(dob.getTime()))return 'Please enter a valid date of birth.'
 if(dob.getTime()>Date.now())return 'Date of birth cannot be in the future.'
 const duplicate=children.some(c=>c.id!==selfId&&normalizedName(c.name)===normalizedName(name)&&c.dateOfBirth===child.dateOfBirth)
 if(duplicate)return 'A child with this name and date of birth already exists.'
 return ''
}
const ageLabel=(dob:string)=>{
 if(!dob)return ''
 const birth=new Date(dob+'T00:00:00'),today=new Date()
 let years=today.getFullYear()-birth.getFullYear()
 if(today.getMonth()<birth.getMonth()||(today.getMonth()===birth.getMonth()&&today.getDate()<birth.getDate()))years--
 return years<1?'Under 1 year old':years===1?'1 year old':`${years} years old`
}

export function ParentSettingsPage({settings,onSave,onCancel}:Props){
 const [draft,setDraft]=useState<ParentSettings>(()=>structuredClone(settings))
 const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([])
 const [routineChildId,setRoutineChildId]=useState(settings.children[0]?.id??'')
 const [addOpen,setAddOpen]=useState(settings.children.length===0)
 const [newChild,setNewChild]=useState<ChildProfile>(()=>createChildProfile(settings.children.length+1))
 const [formError,setFormError]=useState('')
 const [message,setMessage]=useState('')
 useEffect(()=>{const refresh=()=>setVoices(getEnglishVoices());refresh();window.speechSynthesis?.addEventListener('voiceschanged',refresh);return()=>window.speechSynthesis?.removeEventListener('voiceschanged',refresh)},[])
 const updateChild=(id:string,patch:Partial<ChildProfile>)=>setDraft(c=>({...c,children:c.children.map(x=>x.id===id?{...x,...patch}:x)}))
 const replaceChild=(next:ChildProfile)=>setDraft(c=>({...c,children:c.children.map(x=>x.id===next.id?next:x)}))
 const openAdd=()=>{setNewChild(createChildProfile(draft.children.length+1));setFormError('');setAddOpen(true)}
 const confirmAdd=()=>{
  const clean={...newChild,name:newChild.name.trim().replace(/\s+/g,' ')}
  const error=childError(clean,draft.children)
  if(error){setFormError(error);return}
  setDraft(c=>({...c,children:[...c.children,clean]}));setRoutineChildId(clean.id);setAddOpen(false);setMessage(`${clean.name} added. Save settings to finish.`);setFormError('')
 }
 const removeChild=(child:ChildProfile)=>{
  if(!window.confirm(`Remove ${child.name}? This will remove this child profile and its saved routine/history when you save settings.`))return
  setDraft(c=>({...c,children:c.children.filter(x=>x.id!==child.id)}))
  if(routineChildId===child.id)setRoutineChildId('')
  setMessage(`${child.name} marked for removal. Save settings to finish.`)
 }
 const choosePhoto=(id:string,file?:File)=>{if(!file||!file.type.startsWith('image/'))return;if(file.size>3*1024*1024){setMessage('Please choose a picture smaller than 3 MB.');return}const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'&&updateChild(id,{photoDataUrl:reader.result});reader.readAsDataURL(file)}
 const routineChild=draft.children.find(c=>c.id===routineChildId)??draft.children[0]
 const save=()=>{
  for(const child of draft.children){const error=childError(child,draft.children,child.id);if(error){setMessage(`${child.name||'Child'}: ${error}`);return}}
  onSave({...draft,children:draft.children.map(c=>({...c,name:c.name.trim().replace(/\s+/g,' ')}))})
 }
 return <main className="parent-settings-screen"><div className="parent-settings-shell">
  <header className="parent-settings-header"><button className="secondary-button" type="button" onClick={onCancel}>← Back</button><div><span className="parent-eyebrow">🔒 Parent area</span><h1>Family & routines</h1></div></header>
  {message&&<p className="settings-message" role="status">{message}</p>}
  <section className="settings-panel"><div className="settings-panel-heading"><div><span className="settings-icon">👧🧒</span><h2>Children</h2><p>Add each child once. Name + date of birth is used to prevent accidental duplicates.</p></div><button className="add-child-button" type="button" onClick={openAdd}>＋ Add child</button></div>
   {!draft.children.length&&<div className="empty-children"><span>🐻</span><strong>No children added yet</strong><p>Add your first child to begin their Pochu routine.</p><button className="add-child-button" type="button" onClick={openAdd}>Add first child</button></div>}
   <div className="child-settings-list">{draft.children.map(child=><article className="child-settings-card" key={child.id}>
    <label className="child-photo-editor"><span className="child-photo-preview">{child.photoDataUrl?<img src={child.photoDataUrl} alt=""/>:<span>{child.emoji}</span>}</span><span className="photo-edit-label">📷 Change photo</span><input className="visually-hidden" type="file" accept="image/*" onChange={e=>choosePhoto(child.id,e.target.files?.[0])}/></label>
    <div className="child-settings-fields"><label><span>Child’s name *</span><input required value={child.name} maxLength={30} onChange={e=>updateChild(child.id,{name:e.target.value})}/></label>
     <label><span>Date of birth *</span><input type="date" required max={new Date().toISOString().slice(0,10)} value={child.dateOfBirth} onChange={e=>updateChild(child.id,{dateOfBirth:e.target.value})}/><small>{ageLabel(child.dateOfBirth)}</small></label>
     <label><span>Avatar</span><select value={child.emoji} onChange={e=>updateChild(child.id,{emoji:e.target.value})}><option>👧</option><option>👦</option><option>🧒</option><option>🐰</option><option>🦄</option><option>🐻</option></select></label>
     <button className="test-voice-button" type="button" onClick={()=>setRoutineChildId(child.id)}>🗓️ Edit {child.name || 'child'}’s routine</button>
     <button className="remove-child-button" type="button" onClick={()=>removeChild(child)}>Remove child</button>
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
  <div className="settings-actions"><button className="secondary-button" type="button" onClick={onCancel}>Cancel</button><button className="save-settings-button" type="button" onClick={save}>✓ Save settings</button></div>
 </div>
 {addOpen&&<div className="child-modal-backdrop" role="presentation"><section className="child-modal" role="dialog" aria-modal="true" aria-labelledby="add-child-title">
   <div className="child-modal-heading"><div><span>🐻</span><h2 id="add-child-title">{draft.children.length?'Add another child':'Add your first child'}</h2><p>We use name and date of birth together to prevent duplicate profiles.</p></div><button type="button" aria-label="Close" onClick={()=>{setAddOpen(false);setFormError('')}}>×</button></div>
   <label><span>Child’s name *</span><input autoFocus maxLength={30} value={newChild.name} onChange={e=>{setNewChild(c=>({...c,name:e.target.value}));setFormError('')}} placeholder="e.g. Kavleen"/></label>
   <label><span>Date of birth *</span><input type="date" max={new Date().toISOString().slice(0,10)} value={newChild.dateOfBirth} onChange={e=>{setNewChild(c=>({...c,dateOfBirth:e.target.value}));setFormError('')}}/><small>{ageLabel(newChild.dateOfBirth)}</small></label>
   <label><span>Avatar</span><select value={newChild.emoji} onChange={e=>setNewChild(c=>({...c,emoji:e.target.value}))}><option>👧</option><option>👦</option><option>🧒</option><option>🐰</option><option>🦄</option><option>🐻</option></select></label>
   {formError&&<p className="field-error" role="alert">{formError}</p>}
   <div className="child-modal-actions"><button className="secondary-button" type="button" onClick={()=>{setAddOpen(false);setFormError('')}}>Cancel</button><button className="save-settings-button" type="button" onClick={confirmAdd}>Add child</button></div>
  </section></div>}
 </main>
}

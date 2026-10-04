import { useState } from 'react'
import { unlockFamily,type FamilyAccessSession } from '../lib/familyAccess'

type Props={token:string;onUnlock:(session:FamilyAccessSession)=>void;onParent:()=>void}
export function FamilyPinGate({token,onUnlock,onParent}:Props){
 const [pin,setPin]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const submit=async()=>{if(!/^\\d{4,6}$/.test(pin)){setError('Enter your 4–6 digit family PIN.');return}setBusy(true);setError('');try{onUnlock(await unlockFamily(token,pin))}catch{setError('That family link or PIN is not valid. Ask a parent for help.')}finally{setBusy(false)}}
 return <main className="family-pin-screen"><section className="family-pin-card"><div className="family-pin-bear">🐻</div><strong className="family-pin-logo">POCHU</strong><h1>Welcome, family!</h1><p>Enter your family PIN to see your profiles.</p><input autoFocus inputMode="numeric" pattern="[0-9]*" maxLength={6} value={pin} onChange={e=>setPin(e.target.value.replace(/\\D/g,''))} onKeyDown={e=>e.key==='Enter'&&void submit()} aria-label="Family PIN" placeholder="••••"/>{error&&<p role="alert" className="field-error">{error}</p>}<button className="save-settings-button" disabled={busy} onClick={()=>void submit()}>{busy?'Checking…':'Open Pochu'}</button><button className="auth-switch" onClick={onParent}>Parent login</button></section></main>
}

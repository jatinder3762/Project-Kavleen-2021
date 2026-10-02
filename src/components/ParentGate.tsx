import { useState } from 'react'
import { verifyParentPassword } from '../lib/auth'
type Props={onUnlock:()=>void;onCancel:()=>void}
export function ParentGate({onUnlock,onCancel}:Props){
 const [password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');const result=await verifyParentPassword(password);setBusy(false);if(result.ok)onUnlock();else setError(result.message)}
 return <main className="parent-settings-screen"><div className="parent-settings-shell"><section className="settings-panel parent-lock"><div className="settings-icon">🔒</div><h1>Parents only</h1><p>Enter the parent password to change family settings.</p><form onSubmit={submit}><label><span>Password</span><input autoFocus type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<p role="alert">{error}</p>}<div className="settings-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button><button className="save-settings-button" disabled={busy}>{busy?'Checking…':'Unlock settings'}</button></div></form></section></div></main>
}

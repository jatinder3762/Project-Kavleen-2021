import { useState } from 'react'
import { supabase } from '../lib/auth'
type Props={onReady:()=>void;onCancel:()=>void}
export function ParentAuth({onReady,onCancel}:Props){
 const [mode,setMode]=useState<'login'|'register'>('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const submit=async(e:React.FormEvent)=>{e.preventDefault();if(!supabase){setError('Supabase is not configured yet.');return}setBusy(true);setError('')
  const result=mode==='login'?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password})
  setBusy(false);if(result.error){setError(result.error.message);return}
  if(mode==='register'&&!result.data.session){setError('Account created. Check your email to confirm it, then log in.');setMode('login');return}onReady()
 }
 return <main className="parent-settings-screen"><section className="settings-panel parent-auth-card"><button className="secondary-button" onClick={onCancel}>← Back</button><div className="settings-icon">👨‍👩‍👧</div><h1>{mode==='login'?'Parent login':'Create parent account'}</h1><p>Children do not need a password. Parent login protects family settings.</p><form onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={6} required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert">{error}</p>}<button className="save-settings-button" disabled={busy}>{busy?'Please wait…':mode==='login'?'Log in':'Register'}</button></form><button className="auth-switch" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'New parent? Create an account':'Already registered? Log in'}</button></section></main>
}
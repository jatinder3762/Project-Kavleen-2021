import { useState } from 'react'
import { supabase } from '../lib/auth'

type Props={onReady:()=>void}

const authRedirectUrl=()=>new URL(import.meta.env.BASE_URL,window.location.origin).toString()

export function ParentAuth({onReady}:Props){
 const [mode,setMode]=useState<'login'|'register'>('login')
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const submit=async(e:React.FormEvent)=>{
  e.preventDefault()
  if(!supabase){setError('Supabase is not configured yet.');return}
  setBusy(true);setError('')
  const result=mode==='login'
   ?await supabase.auth.signInWithPassword({email,password})
   :await supabase.auth.signUp({email,password,options:{emailRedirectTo:authRedirectUrl()}})
  setBusy(false)
  if(result.error){setError(result.error.message);return}
  if(mode==='register'&&!result.data.session){setError('Account created. Check your email to confirm it, then log in.');setMode('login');return}
  onReady()
 }
 const resendConfirmation=async()=>{
  if(!supabase){setError('Supabase is not configured yet.');return}
  if(!email.trim()){setError('Enter your email above first.');return}
  setBusy(true);setError('')
  const {error:resendError}=await supabase.auth.resend({
   type:'signup',
   email:email.trim(),
   options:{emailRedirectTo:authRedirectUrl()}
  })
  setBusy(false)
  setError(resendError?resendError.message:'Confirmation email sent. Please check your inbox.')
 }
 return <main className="pochu-auth-screen">
  <section className="pochu-hero">
   <div className="pochu-mark" aria-hidden="true">🐻</div>
   <p className="pochu-kicker">Meet your little routine buddy</p>
   <h1>POCHU</h1>
   <h2>Small Steps.<br/>Brighter Tomorrows.</h2>
   <p className="pochu-intro">A cheerful daily routine companion that helps children build independence one happy step at a time.</p>
   <div className="pochu-benefits"><span>⭐ Positive routines</span><span>🎨 Visual & child-friendly</span><span>🔊 Gentle encouragement</span></div>
  </section>
  <section className="parent-auth-card">
   <div className="parent-auth-heading"><span>👨‍👩‍👧</span><div><p>Parent area</p><h2>{mode==='login'?'Welcome back':'Create your family'}</h2></div></div>
   <p className="auth-help">{mode==='login'?'Log in to choose a child and continue their day.':'Create one parent account, then add your children. Children never need passwords.'}</p>
   <form onSubmit={submit}>
    <label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Password<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={6} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
    {error&&<p className="auth-message" role="alert">{error}</p>}
    <button className="pochu-primary" disabled={busy}>{busy?'Please wait…':mode==='login'?'Log in':'Create parent account'}</button>
   </form>
   {mode==='login'&&<button className="auth-switch" type="button" disabled={busy} onClick={resendConfirmation}>Resend confirmation email</button>}
   <button className="auth-switch" type="button" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'New to Pochu? Create an account':'Already have an account? Log in'}</button>
   <p className="child-no-login">🔒 Children do not need an email or password.</p>
  </section>
 </main>
}

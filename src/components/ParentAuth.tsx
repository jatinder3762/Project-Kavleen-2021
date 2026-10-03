import { useEffect, useState } from 'react'
import { supabase } from '../lib/auth'
import { authErrorMessage, isUnverifiedEmail, authRedirectUrl, clearAuthCallback } from '../lib/authFlow'

type Props={onReady:()=>void; recovery?:boolean; initialMessage?:string}
type Mode='login'|'register'|'forgot'|'reset'

export function ParentAuth({onReady,recovery=false,initialMessage=''}:Props){
 const [mode,setMode]=useState<Mode>(recovery?'reset':'login')
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('')
 const [error,setError]=useState(''),[message,setMessage]=useState(initialMessage),[busy,setBusy]=useState(false)
 const [unverifiedEmail,setUnverifiedEmail]=useState<string|null>(null)
 const [cooldown,setCooldown]=useState(0)
 useEffect(()=>{if(recovery)setMode('reset')},[recovery])
 useEffect(()=>{
  if(!cooldown)return
  const timer=window.setTimeout(()=>setCooldown(value=>Math.max(0,value-1)),1000)
  return()=>window.clearTimeout(timer)
 },[cooldown])
 const changeMode=(next:Mode)=>{setMode(next);setError('');setMessage('');setUnverifiedEmail(null);setPassword('');setConfirm('')}
 const submit=async(e:React.FormEvent)=>{
  e.preventDefault()
  if(!supabase){setError('Supabase is not configured yet.');return}
  if(mode==='reset'&&password!==confirm){setError('Passwords do not match.');return}
  setBusy(true);setError('');setMessage('');setUnverifiedEmail(null)
  const address=email.trim()
  try{
   if(mode==='forgot'){
    const {error:resetError}=await supabase.auth.resetPasswordForEmail(address,{redirectTo:authRedirectUrl()})
    if(resetError)setError(authErrorMessage(resetError))
    else {setMessage('If an account exists for '+address+', a password-reset link has been sent. Check your inbox and spam folder.');setCooldown(60)}
    return
   }
   if(mode==='reset'){
    const {error:updateError}=await supabase.auth.updateUser({password})
    if(updateError){setError(authErrorMessage(updateError));return}
    // Clear the recovery session before returning to normal sign-in.
    await supabase.auth.signOut({scope:'local'})
    clearAuthCallback();changeMode('login');setMessage('Password updated successfully. You can now log in with your new password.')
    return
   }
   const result=mode==='login'
    ?await supabase.auth.signInWithPassword({email:address,password})
    :await supabase.auth.signUp({email:address,password,options:{emailRedirectTo:authRedirectUrl()}})
   if(result.error){
    setError(authErrorMessage(result.error))
    if(mode==='login'&&isUnverifiedEmail(result.error))setUnverifiedEmail(address)
    return
   }
   if(mode==='register'&&!result.data.session){changeMode('login');setMessage('Account created! We sent a verification link to '+address+'. Verify your email, then log in.');return}
   onReady()
  }catch{setError('Could not connect. Check your connection and try again.')}
  finally{setBusy(false)}
 }
 const resendConfirmation=async()=>{
  if(!supabase||!unverifiedEmail||busy||cooldown)return
  setBusy(true);setError('');setMessage('')
  try{
   const {error:resendError}=await supabase.auth.resend({type:'signup',email:unverifiedEmail,options:{emailRedirectTo:authRedirectUrl()}})
   if(resendError)setError(authErrorMessage(resendError))
   else{setMessage('Verification email sent. Please check your inbox and spam folder.');setCooldown(60)}
  }catch{setError('Could not connect. Check your connection and try again.')}
  finally{setBusy(false)}
 }
 const title={login:'Welcome back',register:'Create your family',forgot:'Forgot your password?',reset:'Set a new password'}[mode]
 const help={login:'Log in to choose a child and continue their day.',register:'Create one parent account, then add your children. Children never need passwords.',forgot:'Enter your parent-account email to receive a password-reset link.',reset:'Choose a new password for your parent account.'}[mode]
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
   <div className="parent-auth-heading"><span>👨‍👩‍👧</span><div><p>Parent area</p><h2>{title}</h2></div></div>
   <p className="auth-help">{help}</p>
   <form onSubmit={submit}>
    {mode!=='reset'&&<label>Email<input type="email" autoComplete="email" required disabled={busy} value={email} onChange={e=>{setEmail(e.target.value);setUnverifiedEmail(null);setError('');setMessage('')}}/></label>}
    {mode!=='forgot'&&<label>{mode==='reset'?'New password':'Password'}<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='login'?undefined:6} required disabled={busy} value={password} onChange={e=>{setPassword(e.target.value);setUnverifiedEmail(null)}}/></label>}
    {mode==='reset'&&<label>Confirm new password<input type="password" autoComplete="new-password" minLength={6} required disabled={busy} value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>}
    {mode==='login'&&<button className="auth-switch auth-forgot" type="button" disabled={busy} onClick={()=>changeMode('forgot')}>Forgot Password?</button>}
    {error&&<p className="auth-message" role="alert">{error}</p>}
    {message&&<p className="auth-message auth-success" role="status">{message}</p>}
    <button className="pochu-primary" disabled={busy||(mode==='forgot'&&cooldown>0)}>{busy?'Please wait…':mode==='login'?'Log in':mode==='register'?'Create parent account':mode==='reset'?'Save new password':cooldown?`Send again in ${cooldown}s`:'Send reset link'}</button>
   </form>
   {mode==='login'&&unverifiedEmail&&<button className="auth-switch" type="button" disabled={busy||cooldown>0} onClick={resendConfirmation}>{cooldown?`Resend available in ${cooldown}s`:'Resend verification email'}</button>}
   {(mode==='login'||mode==='register')&&<button className="auth-switch" type="button" disabled={busy} onClick={()=>changeMode(mode==='login'?'register':'login')}>{mode==='login'?'New to Pochu? Create an account':'Already have an account? Log in'}</button>}
   {(mode==='forgot'||mode==='reset')&&<button className="auth-switch" type="button" disabled={busy} onClick={async()=>{if(mode==='reset'){await supabase?.auth.signOut({scope:'local'});clearAuthCallback()}changeMode('login')}}>Back to log in</button>}
   {mode==='reset'&&<button className="auth-switch" type="button" disabled={busy} onClick={()=>changeMode('forgot')}>Request another reset link</button>}
   <p className="child-no-login">🔒 Children do not need an email or password.</p>
  </section>
 </main>
}

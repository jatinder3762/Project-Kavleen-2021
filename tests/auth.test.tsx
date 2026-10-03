import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ParentAuth } from '../src/components/ParentAuth'
import App from '../src/App'

const mocks=vi.hoisted(()=>({
 signInWithPassword:vi.fn(),signUp:vi.fn(),resend:vi.fn(),resetPasswordForEmail:vi.fn(),updateUser:vi.fn(),signOut:vi.fn(),getSession:vi.fn(),onAuthStateChange:vi.fn(),loadFamilySettings:vi.fn(),
 callback:{recovery:false,error:null as string|null},
}))
vi.mock('../src/lib/auth',()=>({supabase:{auth:mocks}}))
vi.mock('../src/lib/familyRepository',()=>({loadFamilySettings:mocks.loadFamilySettings,saveFamilySettings:vi.fn()}))
vi.mock('../src/lib/authFlow',async importOriginal=>({...await importOriginal<object>(),authCallback:mocks.callback}))
beforeEach(()=>{
 vi.resetAllMocks()
 mocks.callback.recovery=false;mocks.callback.error=null
 mocks.onAuthStateChange.mockReturnValue({data:{subscription:{unsubscribe:vi.fn()}}})
 mocks.signOut.mockResolvedValue({error:null})
 window.history.replaceState(null,'','/')
})
afterEach(cleanup)
const fillLogin=()=>{
 fireEvent.change(screen.getByLabelText('Email'),{target:{value:'parent@example.com'}})
 fireEvent.change(screen.getByLabelText('Password'),{target:{value:'password123'}})
 fireEvent.click(screen.getByRole('button',{name:'Log in'}))
}
describe('Parent authentication',()=>{
 it('reveals resend only after an unverified sign-in and applies cooldown',async()=>{
  mocks.signInWithPassword.mockResolvedValue({error:{code:'email_not_confirmed',message:'Email not confirmed'}})
  mocks.resend.mockResolvedValue({error:null})
  render(<ParentAuth onReady={vi.fn()}/>)
  expect(screen.queryByRole('button',{name:'Resend verification email'})).toBeNull()
  fillLogin()
  fireEvent.click(await screen.findByRole('button',{name:'Resend verification email'}))
  await waitFor(()=>expect(mocks.resend).toHaveBeenCalledWith({type:'signup',email:'parent@example.com',options:{emailRedirectTo:'http://localhost:3000/'}}))
  expect((await screen.findByRole('button',{name:/Resend available/}) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.change(screen.getByLabelText('Email'),{target:{value:'other@example.com'}})
  expect(screen.queryByRole('button',{name:/Resend/})).toBeNull()
 })
 it('does not offer verification resend on a wrong-password error',async()=>{
  mocks.signInWithPassword.mockResolvedValue({error:{code:'invalid_credentials',message:'Invalid login credentials'}})
  render(<ParentAuth onReady={vi.fn()}/>);fillLogin()
  expect(await screen.findByRole('alert')).toHaveProperty('textContent',expect.stringContaining('Email or password is incorrect'))
  expect(screen.queryByRole('button',{name:/Resend/})).toBeNull()
 })
 it('sends a reset link and uses an account-neutral confirmation',async()=>{
  mocks.resetPasswordForEmail.mockResolvedValue({error:null})
  render(<ParentAuth onReady={vi.fn()}/>)
  fireEvent.click(screen.getByRole('button',{name:'Forgot Password?'}))
  fireEvent.change(screen.getByLabelText('Email'),{target:{value:'parent@example.com'}})
  fireEvent.click(screen.getByRole('button',{name:'Send reset link'}))
  expect(await screen.findByRole('status')).toHaveProperty('textContent',expect.stringContaining('If an account exists'))
  expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith('parent@example.com',{redirectTo:'http://localhost:3000/'})
 })
 it('validates matching passwords and returns to login after recovery',async()=>{
  mocks.updateUser.mockResolvedValue({error:null})
  const onReady=vi.fn();render(<ParentAuth recovery onReady={onReady}/>)
  fireEvent.change(screen.getByLabelText('New password'),{target:{value:'newpassword'}})
  fireEvent.change(screen.getByLabelText('Confirm new password'),{target:{value:'different'}})
  fireEvent.click(screen.getByRole('button',{name:'Save new password'}))
  expect(await screen.findByRole('alert')).toHaveProperty('textContent','Passwords do not match.')
  expect(mocks.updateUser).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Confirm new password'),{target:{value:'newpassword'}})
  fireEvent.click(screen.getByRole('button',{name:'Save new password'}))
  expect(await screen.findByRole('button',{name:'Log in'})).toBeTruthy()
  expect(mocks.updateUser).toHaveBeenCalledWith({password:'newpassword'})
  expect(mocks.signOut).toHaveBeenCalledWith({scope:'local'})
  expect(onReady).not.toHaveBeenCalled()
 })
 it('clears loading state after a connection failure',async()=>{
  mocks.signInWithPassword.mockRejectedValue(new Error('Network error'))
  render(<ParentAuth onReady={vi.fn()}/>);fillLogin()
  expect(await screen.findByRole('alert')).toHaveProperty('textContent',expect.stringContaining('Could not connect'))
  expect((screen.getByRole('button',{name:'Log in'}) as HTMLButtonElement).disabled).toBe(false)
 })
})
describe('Recovery routing',()=>{
 it('rejects a recovery marker without a valid session',async()=>{
  mocks.callback.recovery=true
  mocks.getSession.mockResolvedValue({data:{session:null},error:null})
  render(<App/>)
  expect(await screen.findByRole('status')).toHaveProperty('textContent',expect.stringContaining('Please use Forgot Password'))
  expect(screen.queryByRole('button',{name:'Save new password'})).toBeNull()
  expect(mocks.loadFamilySettings).not.toHaveBeenCalled()
 })
 it('opens recovery before family loading when a recovery session exists',async()=>{
  mocks.callback.recovery=true
  mocks.getSession.mockResolvedValue({data:{session:{user:{id:'parent'}}},error:null})
  render(<App/>)
  expect(await screen.findByRole('button',{name:'Save new password'})).toBeTruthy()
  expect(mocks.loadFamilySettings).not.toHaveBeenCalled()
  expect(window.location.search).toBe('?auth=recovery')
 })
 it('shows expired-link guidance without opening the family dashboard',async()=>{
  mocks.callback.error='Email link is invalid or has expired'
  mocks.getSession.mockResolvedValue({data:{session:null},error:null})
  render(<App/>)
  expect(await screen.findByRole('status')).toHaveProperty('textContent',expect.stringContaining('expired or is invalid'))
  expect(mocks.loadFamilySettings).not.toHaveBeenCalled()
 })
 it('routes PASSWORD_RECOVERY events to the reset form',async()=>{
  mocks.getSession.mockImplementation(()=>new Promise(()=>{}))
  render(<App/>)
  const callback=mocks.onAuthStateChange.mock.calls[0][0]
  callback('PASSWORD_RECOVERY')
  expect(await screen.findByRole('button',{name:'Save new password'})).toBeTruthy()
  expect(mocks.loadFamilySettings).not.toHaveBeenCalled()
 })
})

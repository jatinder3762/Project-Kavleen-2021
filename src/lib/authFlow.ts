type AuthFailure={code?:string;message:string;status?:number}

export const isUnverifiedEmail=(error:AuthFailure)=>error.code==='email_not_confirmed'||/email not confirmed/i.test(error.message)

export function authErrorMessage(error:AuthFailure){
 if(isUnverifiedEmail(error))return 'Your email hasn’t been verified yet. Please check your inbox and verify your email before logging in.'
 if(error.status===429||error.code?.includes('rate_limit'))return 'Too many attempts. Please wait a minute before trying again.'
 if(error.code==='invalid_credentials')return 'Email or password is incorrect. Check your details or use Forgot Password.'
 if(['otp_expired','session_not_found','refresh_token_not_found','refresh_token_already_used'].includes(error.code??'')||/session missing/i.test(error.message))return 'This reset link has expired or is invalid. Please request a new password-reset link.'
 return error.message
}

// Capture callback details before Supabase consumes and removes the URL hash.
const query=new URLSearchParams(window.location.search)
const hash=new URLSearchParams(window.location.hash.slice(1))
export const authCallback={
 recovery:hash.get('type')==='recovery'||query.get('auth')==='recovery',
 error:hash.get('error_description')||query.get('error_description')||hash.get('error')||query.get('error'),
}
export const authRedirectUrl=()=>new URL(import.meta.env.BASE_URL,window.location.origin).toString()
export function clearAuthCallback(){
 const url=new URL(window.location.href)
 for(const key of ['auth','error','error_code','error_description','code'])url.searchParams.delete(key)
 url.hash=''
 window.history.replaceState(null,'',url)
}

export function markPasswordRecovery(){
 const url=new URL(window.location.href)
 url.searchParams.set('auth','recovery')
 window.history.replaceState(null,'',url)
}

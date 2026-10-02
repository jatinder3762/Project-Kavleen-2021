import { createClient } from '@supabase/supabase-js'

const url=import.meta.env.VITE_SUPABASE_URL?.trim()
const key=import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
export const supabase=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null

export async function verifyParentPassword(password:string){
 if(!supabase) return {ok:false,message:'Supabase is not configured.'}
 const {data:{user}}=await supabase.auth.getUser()
 if(!user?.email) return {ok:false,message:'Please sign in as a parent first.'}
 const {error}=await supabase.auth.signInWithPassword({email:user.email,password})
 return error?{ok:false,message:'Password is incorrect.'}:{ok:true,message:''}
}

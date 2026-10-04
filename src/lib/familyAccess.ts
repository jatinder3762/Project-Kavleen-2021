import { supabase } from './auth'
import type { Activity, ChildProfile } from '../types'

export type FamilyAccessChild={id:string;name:string;emoji:string}
export type FamilyAccessSession={token:string;pin:string;children:FamilyAccessChild[]}

const ACCESS_KEY='pochu:family-access'

export const familyLink=(token:string)=>new URL(`?family=${encodeURIComponent(token)}`,new URL(import.meta.env.BASE_URL,window.location.origin)).toString()
export const tokenFromUrl=()=>new URLSearchParams(window.location.search).get('family')?.trim()??''

export function rememberFamilyAccess(session:FamilyAccessSession){sessionStorage.setItem(ACCESS_KEY,JSON.stringify(session))}
export function readFamilyAccess():FamilyAccessSession|null{try{const raw=sessionStorage.getItem(ACCESS_KEY);return raw?JSON.parse(raw):null}catch{return null}}
export function clearFamilyAccess(){sessionStorage.removeItem(ACCESS_KEY)}

export async function createFamilyAccess(){
 if(!supabase)throw new Error('Supabase is not configured.')
 const {data,error}=await supabase.rpc('ensure_family_access')
 if(error)throw error
 return data as string|null
}

export async function regenerateFamilyAccess(keepPin=true,newPin?:string){
 if(!supabase)throw new Error('Supabase is not configured.')
 const {data,error}=await supabase.rpc('regenerate_family_access',{keep_pin:keepPin,new_pin:newPin??null})
 if(error)throw error
 return data as string
}

export async function changeFamilyPin(pin:string){
 if(!supabase)throw new Error('Supabase is not configured.')
 const {error}=await supabase.rpc('change_family_access_pin',{new_pin:pin})
 if(error)throw error
}

export async function setFamilyAccessEnabled(enabled:boolean){
 if(!supabase)throw new Error('Supabase is not configured.')
 const {error}=await supabase.rpc('set_family_access_enabled',{is_enabled:enabled})
 if(error)throw error
}

export async function unlockFamily(token:string,pin:string):Promise<FamilyAccessSession>{
 if(!supabase)throw new Error('Supabase is not configured.')
 const {data,error}=await supabase.rpc('open_family_access',{access_token:token,access_pin:pin})
 if(error)throw error
 const session={token,pin,children:(data?.children??[]) as FamilyAccessChild[]}
 rememberFamilyAccess(session);return session
}

export async function loadFamilyChild(session:FamilyAccessSession,childId:string):Promise<ChildProfile>{
 if(!supabase)throw new Error('Supabase is not configured.')
 const {data,error}=await supabase.rpc('load_child_access',{access_token:session.token,access_pin:session.pin,requested_child:childId})
 if(error)throw error
 const c=data.child
 return {id:c.id,name:c.name,dateOfBirth:'',emoji:c.emoji,sections:data.sections??[],activities:(data.activities??[]) as Activity[]}
}

export async function saveFamilyCompletion(session:FamilyAccessSession,childId:string,activityId:string,completedAt:string,date:string){
 if(!supabase)throw new Error('Supabase is not configured.')
 const {error}=await supabase.rpc('save_child_completion',{access_token:session.token,access_pin:session.pin,requested_child:childId,requested_activity:activityId,completed_at:completedAt,activity_date:date})
 if(error)throw error
}

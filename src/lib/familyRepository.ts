import { supabase } from './auth'
import type { Activity, ChildProfile, ParentSettings, RoutineSection } from '../types'

const isUuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
export async function loadFamilySettings():Promise<ParentSettings|null>{
 if(!supabase)return null
 const {data:{user}}=await supabase.auth.getUser(); if(!user||user.is_anonymous)return null
 const {data:membership}=await supabase.from('family_members').select('family_id').eq('user_id',user.id).limit(1).maybeSingle()
 let familyId=membership?.family_id
 if(!familyId){const {data,error}=await supabase.rpc('create_family_with_owner',{family_name:'My Family'});if(error)throw error;familyId=data}
 const {data:family,error:fe}=await supabase.from('families').select('voice_settings').eq('id',familyId).single();if(fe)throw fe
 const {data:children,error:ce}=await supabase.from('children').select('id,name,emoji,photo_path').eq('family_id',familyId).order('created_at');if(ce)throw ce
 const profiles:ChildProfile[]=[]
 for(const child of children??[]){
  const [{data:sections,error:se},{data:activities,error:ae}]=await Promise.all([
   supabase.from('routine_sections').select('*').eq('child_id',child.id).eq('enabled',true).order('sort_order'),
   supabase.from('routine_activities').select('*').eq('child_id',child.id).eq('enabled',true).order('sort_order')
  ]);if(se)throw se;if(ae)throw ae
  let photoDataUrl:string|null=null;if(child.photo_path){const {data}=await supabase.storage.from('child-photos').createSignedUrl(child.photo_path,3600);photoDataUrl=data?.signedUrl??null}
  profiles.push({id:child.id,name:child.name,emoji:child.emoji,photoDataUrl,sections:(sections??[]).map(s=>({id:s.id,label:s.label,icon:s.icon,order:s.sort_order})),activities:(activities??[]).map(a=>({id:a.id,emoji:a.emoji,label:a.label,sectionId:a.section_id,type:a.activity_type,order:a.sort_order,durationMinutes:a.duration_minutes??undefined,dailyLimitMinutes:a.daily_limit_minutes??undefined,scheduleTime:a.schedule_time?.slice(0,5)??undefined,days:a.days??undefined,triggerAfterId:a.trigger_after_id??undefined,reminderMinutes:a.reminder_minutes,enabled:a.enabled}))})
 }
 return {children:profiles,voice:family?.voice_settings}
}

export async function saveFamilySettings(settings:ParentSettings):Promise<boolean>{
 if(!supabase)return false
 const {data:{user}}=await supabase.auth.getUser();if(!user||user.is_anonymous)return false
 const {data:membership}=await supabase.from('family_members').select('family_id').eq('user_id',user.id).limit(1).maybeSingle()
 let familyId=membership?.family_id;if(!familyId){const {data,error}=await supabase.rpc('create_family_with_owner',{family_name:'My Family'});if(error)throw error;familyId=data}
 const {error:ve}=await supabase.from('families').update({voice_settings:settings.voice}).eq('id',familyId);if(ve)throw ve
 for(const child of settings.children){
  let childId=child.id
  if(!isUuid(childId)){const {data,error}=await supabase.from('children').insert({family_id:familyId,name:child.name,emoji:child.emoji}).select('id').single();if(error)throw error;childId=data.id}
  else {const {error}=await supabase.from('children').update({name:child.name,emoji:child.emoji}).eq('id',childId);if(error)throw error}
  const sectionMap=new Map<string,string>()
  for(const section of child.sections??[]){
   let sid=section.id;if(!isUuid(sid)){const {data,error}=await supabase.from('routine_sections').insert({child_id:childId,label:section.label,icon:section.icon,sort_order:section.order}).select('id').single();if(error)throw error;sid=data.id}else{const {error}=await supabase.from('routine_sections').update({label:section.label,icon:section.icon,sort_order:section.order}).eq('id',sid);if(error)throw error}sectionMap.set(section.id,sid)
  }
  for(const activity of child.activities??[]){
   const row={child_id:childId,section_id:sectionMap.get(activity.sectionId)??activity.sectionId,label:activity.label,emoji:activity.emoji,activity_type:activity.type,sort_order:activity.order,duration_minutes:activity.durationMinutes??null,daily_limit_minutes:activity.dailyLimitMinutes??null,schedule_time:activity.scheduleTime||null,days:activity.days??null,reminder_minutes:activity.reminderMinutes??[5,1],enabled:activity.enabled!==false}
   if(isUuid(activity.id)){const {error}=await supabase.from('routine_activities').update(row).eq('id',activity.id);if(error)throw error}else{const {error}=await supabase.from('routine_activities').insert(row);if(error)throw error}
  }
 }
 return true
}

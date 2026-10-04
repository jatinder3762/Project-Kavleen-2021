import { supabase } from './auth'
import { defaultVoiceSettings } from './settings'
import type { Activity, ChildProfile, ParentSettings, RoutineSection } from '../types'

const isUuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

async function getFamilyId(){
 if(!supabase)throw new Error('Supabase is not configured.')
 const {data:{user}}=await supabase.auth.getUser()
 if(!user||user.is_anonymous)throw new Error('Parent authentication required.')
 const {data:membership,error:me}=await supabase.from('family_members').select('family_id').eq('user_id',user.id).limit(1).maybeSingle()
 if(me)throw me
 if(membership?.family_id)return membership.family_id as string
 const {data,error}=await supabase.rpc('create_family_with_owner',{family_name:'My Family'})
 if(error)throw error
 return data as string
}

export async function loadFamilySettings():Promise<ParentSettings|null>{
 if(!supabase)return null
 const {data:{user}}=await supabase.auth.getUser(); if(!user||user.is_anonymous)return null
 const familyId=await getFamilyId()
 const {data:family,error:fe}=await supabase.from('families').select('voice_settings').eq('id',familyId).single();if(fe)throw fe
 const {data:children,error:ce}=await supabase.from('children').select('id,name,emoji,photo_path').eq('family_id',familyId).order('created_at');if(ce)throw ce
 const profiles:ChildProfile[]=[]
 for(const child of children??[]){
  const [{data:sections,error:se},{data:activities,error:ae}]=await Promise.all([
   supabase.from('routine_sections').select('*').eq('child_id',child.id).eq('enabled',true).order('sort_order'),
   supabase.from('routine_activities').select('*').eq('child_id',child.id).eq('enabled',true).order('sort_order')
  ]);if(se)throw se;if(ae)throw ae
  let photoDataUrl:string|null=null
  if(child.photo_path){const {data}=await supabase.storage.from('child-photos').createSignedUrl(child.photo_path,3600);photoDataUrl=data?.signedUrl??null}
  profiles.push({id:child.id,name:child.name,emoji:child.emoji,photoDataUrl,sections:(sections??[]).map(s=>({id:s.id,label:s.label,icon:s.icon,order:s.sort_order})),activities:(activities??[]).map(a=>({id:a.id,emoji:a.emoji,label:a.label,sectionId:a.section_id,type:a.activity_type,order:a.sort_order,durationMinutes:a.duration_minutes??undefined,dailyLimitMinutes:a.daily_limit_minutes??undefined,scheduleTime:a.schedule_time?.slice(0,5)??undefined,days:a.days??undefined,triggerAfterId:a.trigger_after_id??undefined,reminderMinutes:a.reminder_minutes,enabled:a.enabled}))})
 }
 return {children:profiles,voice:{...defaultVoiceSettings,...(family?.voice_settings??{})}}
}

export async function saveFamilySettings(settings:ParentSettings):Promise<ParentSettings>{
 if(!supabase)throw new Error('Supabase is not configured.')
 const familyId=await getFamilyId()
 const {error:ve}=await supabase.from('families').update({voice_settings:settings.voice}).eq('id',familyId);if(ve)throw ve
 const {data:existingChildren,error:existingError}=await supabase.from('children').select('id').eq('family_id',familyId);if(existingError)throw existingError
 const desiredIds=new Set(settings.children.map(child=>child.id).filter(isUuid))
 const removedIds=(existingChildren??[]).map(child=>child.id as string).filter(id=>!desiredIds.has(id))
 if(removedIds.length){
  const {error:deleteError}=await supabase.from('children').delete().eq('family_id',familyId).in('id',removedIds);if(deleteError)throw deleteError
 }
 const normalizedChildren:ChildProfile[]=[]
 for(const child of settings.children){
  let childId=child.id
  if(!isUuid(childId)){
   const {data,error}=await supabase.from('children').insert({family_id:familyId,name:child.name,emoji:child.emoji}).select('id').single();if(error)throw error;childId=data.id
  }else{
   const {error}=await supabase.from('children').update({name:child.name,emoji:child.emoji}).eq('id',childId);if(error)throw error
  }

  const sectionMap=new Map<string,string>(),normalizedSections:RoutineSection[]=[]
  for(const section of child.sections??[]){
   let sid=section.id
   if(!isUuid(sid)){
    const {data,error}=await supabase.from('routine_sections').insert({child_id:childId,label:section.label,icon:section.icon,sort_order:section.order}).select('id').single();if(error)throw error;sid=data.id
   }else{
    const {error}=await supabase.from('routine_sections').update({label:section.label,icon:section.icon,sort_order:section.order}).eq('id',sid);if(error)throw error
   }
   sectionMap.set(section.id,sid);normalizedSections.push({...section,id:sid})
  }

  const activityMap=new Map<string,string>(),normalizedActivities:Activity[]=[]
  for(const activity of child.activities??[]){
   const row={child_id:childId,section_id:sectionMap.get(activity.sectionId)??activity.sectionId,label:activity.label,emoji:activity.emoji,activity_type:activity.type,sort_order:activity.order,duration_minutes:activity.durationMinutes??null,daily_limit_minutes:activity.dailyLimitMinutes??null,schedule_time:activity.scheduleTime||null,days:activity.days??null,reminder_minutes:activity.reminderMinutes??[5,1],enabled:activity.enabled!==false,trigger_after_id:null}
   let aid=activity.id
   if(isUuid(aid)){const {error}=await supabase.from('routine_activities').update(row).eq('id',aid);if(error)throw error}
   else{const {data,error}=await supabase.from('routine_activities').insert(row).select('id').single();if(error)throw error;aid=data.id}
   activityMap.set(activity.id,aid)
   normalizedActivities.push({...activity,id:aid,sectionId:row.section_id})
  }
  for(let i=0;i<(child.activities??[]).length;i++){
   const source=child.activities![i],target=normalizedActivities[i]
   if(!source.triggerAfterId)continue
   const triggerId=activityMap.get(source.triggerAfterId)??source.triggerAfterId
   const {error}=await supabase.from('routine_activities').update({trigger_after_id:triggerId}).eq('id',target.id);if(error)throw error
   normalizedActivities[i]={...target,triggerAfterId:triggerId}
  }
  normalizedChildren.push({...child,id:childId,sections:normalizedSections,activities:normalizedActivities})
 }
 return {...settings,children:normalizedChildren}
}

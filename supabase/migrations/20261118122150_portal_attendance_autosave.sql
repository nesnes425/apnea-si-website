begin;
alter table public.portal_sessions add column attendance_roster jsonb check(attendance_roster is null or jsonb_typeof(attendance_roster)='array');
-- Receipts make a retry after a lost response a no-op, even after another coach's edit.
create table portal_private.attendance_receipts (
 actor_id uuid not null references public.portal_staff(id), operation_id uuid not null,
 session_id uuid not null references public.portal_sessions(id), request jsonb not null,
 created_at timestamptz not null default now(), primary key(actor_id,operation_id)
);
alter table portal_private.attendance_receipts enable row level security;
revoke all on portal_private.attendance_receipts from public,anon,authenticated;

create or replace function portal_private.portal_save_change(input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; target public.portal_sessions; previous jsonb; receipt jsonb;
 roster jsonb; member public.portal_members; current_entry jsonb; packed jsonb; regular boolean;
 op uuid; mid uuid; note text; subject text;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 select * into target from public.portal_sessions where id=(input->>'session_id')::uuid for update;
 if actor.id is null or (input->>'actor_id')::uuid is distinct from actor.id or target.id is null
 or (actor.role<>'admin' and target.coach_id<>actor.id and not exists(select 1 from public.portal_additional_coaches a where a.session_id=target.id and a.coach_id=actor.id)) then raise exception 'unauthorized';end if;
 op:=(input->>'operation_id')::uuid;
 if op is null then raise exception 'invalid operation';end if;
 select request into receipt from portal_private.attendance_receipts where actor_id=actor.id and operation_id=op;
 if found then
   if receipt<>input then raise exception 'operation reused';end if;
   return jsonb_build_object('ok',true,'session',to_jsonb(target));
 end if;
 if target.status='cancelled' or target.date>(now() at time zone 'Europe/Ljubljana')::date then raise exception 'not editable';end if;
 if actor.role<>'admin' and ((target.status='closed' and target.first_saved_at is null) or clock_timestamp()>=target.first_saved_at+interval '168 hours') then raise exception 'edit window expired';end if;
 previous:=to_jsonb(target);
 if input->>'type'='attendance' then
   mid:=(input->>'member_id')::uuid;
   if mid is null or coalesce(input->>'value','') not in ('present','absent','remove') or not(input ? 'expected') then raise exception 'invalid change';end if;
   select e into current_entry from jsonb_array_elements(target.entries) e where e->>'member_id'=mid::text;
   if (current_entry->>'status') is distinct from (input->>'expected') then
     return jsonb_build_object('ok',false,'conflict',true,'error','Ta vnos je medtem spremenil drug trener. Preverite njegovo vrednost in izberite, katero želite obdržati.','session',to_jsonb(target));
   end if;
   roster:=target.attendance_roster;
   if roster is null then
     if target.status='closed' then
       select coalesce(jsonb_agg(jsonb_build_object('id',e->>'member_id','name',e->>'name','group_id',target.group_id)),'[]') into roster from jsonb_array_elements(target.entries) e where e->>'kind'='regular';
     else
       select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'name',m.name,'group_id',target.group_id)),'[]') into roster from public.portal_members m where exists(select 1 from public.portal_memberships r where r.member_id=m.id and r.group_id=target.group_id and target.date>=r.valid_from and (r.valid_until is null or target.date<=r.valid_until));
     end if;
   end if;
   regular:=exists(select 1 from jsonb_array_elements(roster) r where r->>'id'=mid::text);
   select * into member from public.portal_members where id=mid;
   if member.id is null or (not regular and current_entry is null and not exists(select 1 from public.portal_memberships r join public.portal_groups g on g.id=r.group_id where r.member_id=mid and g.season=(select season from public.portal_groups where id=target.group_id) and target.date>=r.valid_from and (r.valid_until is null or target.date<=r.valid_until))) then raise exception 'invalid member';end if;
   if regular and input->>'value'='remove' then raise exception 'cannot remove regular member';end if;
   select coalesce(jsonb_agg(e),'[]') into packed from jsonb_array_elements(target.entries) e where e->>'member_id'<>mid::text;
   if input->>'value'<>'remove' then packed:=packed||jsonb_build_array(jsonb_build_object('member_id',mid,'name',coalesce(current_entry->>'name',(select r->>'name' from jsonb_array_elements(roster) r where r->>'id'=mid::text),member.name),'status',input->>'value','kind',case when regular then 'regular' else 'makeup' end));end if;
   if jsonb_array_length(packed)>100 then raise exception 'too many entries';end if;
   update public.portal_sessions set entries=packed,attendance_roster=roster,
     first_saved_at=coalesce(first_saved_at,case when status<>'closed' then clock_timestamp() end),
     status=case when exists(select 1 from jsonb_array_elements(roster) r where not exists(select 1 from jsonb_array_elements(packed) e where e->>'member_id'=r->>'id')) then 'planned' else 'closed' end,
     version=version+1 where id=target.id returning * into target;
 elsif input->>'type'='comment' then
   note:=trim(coalesce(input->>'value',''));
   if note='' or length(note)>4000 or not(input ? 'expected') then raise exception 'invalid comment';end if;
   if target.comment is distinct from (input->>'expected') then
     return jsonb_build_object('ok',false,'conflict',true,'error','Komentar je medtem spremenil drug trener. Preverite trenutno vsebino.','session',to_jsonb(target));
   end if;
   if target.comment<>note then
     select concat_ws(' in ',t.name,(select string_agg(st.name,' in ' order by ac.slot) from public.portal_additional_coaches ac join public.portal_staff st on st.id=ac.coach_id where ac.session_id=target.id))||', '||g.label||', '||to_char(target.date,'DD. MM. YYYY') into subject from public.portal_staff t,public.portal_groups g where t.id=target.coach_id and g.id=target.group_id;
     update public.portal_sessions set comment=note,version=version+1,mail_version=version+1,mail_subject=subject,mail_status='pending' where id=target.id returning * into target;
     update public.portal_outbox set status='superseded' where session_id=target.id and status='pending' and version is distinct from target.mail_version;
     insert into public.portal_outbox(session_id,version,subject,body) values(target.id,target.version,subject,note);
   end if;
 else raise exception 'invalid type';end if;
 if previous is distinct from to_jsonb(target) then insert into public.portal_audit(session_id,actor,before_value,after_value) values(target.id,actor.id,previous,to_jsonb(target));end if;
 insert into portal_private.attendance_receipts(actor_id,operation_id,session_id,request) values(actor.id,op,target.id,input);
 return jsonb_build_object('ok',true,'session',to_jsonb(target));
end $$;
create function public.portal_save_change(input jsonb) returns jsonb language plpgsql set search_path='' as $$
begin perform portal_private.check_device_session(true);return portal_private.portal_save_change(input);end $$;
revoke all on function portal_private.portal_save_change(jsonb) from public,anon;
revoke all on function public.portal_save_change(jsonb) from public,anon;
grant execute on function portal_private.portal_save_change(jsonb),public.portal_save_change(jsonb) to authenticated;

-- Backward-compatible manual saves retain the same seven-day deadline.
create or replace function portal_private.portal_close_session(input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; target public.portal_sessions; previous jsonb; item jsonb; member public.portal_members; packed jsonb:='[]'; note text; subject text; changed boolean; roster_ids uuid[]; regular boolean;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 select * into target from public.portal_sessions where id=(input->>'session_id')::uuid for update;
 if actor.id is null or target.id is null or (actor.role<>'admin' and target.coach_id<>actor.id and not exists(select 1 from public.portal_additional_coaches ac where ac.session_id=target.id and ac.coach_id=actor.id)) then raise exception 'unauthorized'; end if;
 if target.version is distinct from (input->>'version')::integer then raise exception 'conflict'; end if;
 if target.status='cancelled' or target.date>(now() at time zone 'Europe/Ljubljana')::date  then raise exception 'not editable'; end if;
 if actor.role<>'admin' and ((target.status='closed' and target.first_saved_at is null) or clock_timestamp()>=target.first_saved_at+interval '168 hours') then raise exception 'Rok 7 dni od prvega shranjevanja je potekel. Popravek naj uredi vodstvo.';end if;
 if jsonb_typeof(input->'entries') is distinct from 'array' or jsonb_array_length(input->'entries')>100 then raise exception 'invalid entries'; end if;
 if (select count(*) from jsonb_array_elements(input->'entries'))<>(select count(distinct e->>'member_id') from jsonb_array_elements(input->'entries') e) then raise exception 'duplicate member'; end if;
 if target.attendance_roster is not null then
 select coalesce(array_agg((r->>'id')::uuid),'{}') into roster_ids from jsonb_array_elements(target.attendance_roster) r;
 elsif target.status='closed' then
 select coalesce(array_agg((e->>'member_id')::uuid),'{}') into roster_ids from jsonb_array_elements(target.entries) e where e->>'kind'='regular';
 else
 select coalesce(array_agg(distinct e.member_id),'{}') into roster_ids from public.portal_memberships e where e.group_id=target.group_id and target.date>=e.valid_from and (e.valid_until is null or target.date<=e.valid_until);
 end if;
 if exists(select 1 from unnest(roster_ids) mid where not exists(select 1 from jsonb_array_elements(input->'entries') e where e->>'member_id'=mid::text and e->>'kind'='regular')) then raise exception 'incomplete roster';end if;
 for item in select * from jsonb_array_elements(input->'entries') loop
  select m.* into member from public.portal_members m where m.id=(item->>'member_id')::uuid;
  regular:=member.id=any(roster_ids);
  if member.id is null or coalesce(item->>'status','') not in ('present','absent') or coalesce(item->>'kind','') not in ('regular','makeup') or ((item->>'kind'='regular')<>regular) then raise exception 'invalid member'; end if;
  if not regular and not exists(select 1 from public.portal_memberships e join public.portal_groups g on g.id=e.group_id where e.member_id=member.id and g.season=(select season from public.portal_groups where id=target.group_id) and target.date>=e.valid_from and (e.valid_until is null or target.date<=e.valid_until)) and not exists(select 1 from jsonb_array_elements(target.entries) e where e->>'member_id'=member.id::text and e->>'kind'='makeup') then raise exception 'inactive makeup member';end if;
  packed:=packed||jsonb_build_array(jsonb_build_object('member_id',member.id,'name',coalesce((select e->>'name' from jsonb_array_elements(target.entries) e where e->>'member_id'=member.id::text),member.name),'status',item->>'status','kind',item->>'kind'));
 end loop;
 note:=trim(coalesce(input->>'comment',''));if length(note)>4000 then raise exception 'comment too long';end if;
 previous:=to_jsonb(target);changed:=target.status<>'closed' or target.comment<>note;
 select concat_ws(' in ',t.name,(select string_agg(st.name,' in ' order by ac.slot) from public.portal_additional_coaches ac join public.portal_staff st on st.id=ac.coach_id where ac.session_id=target.id))||', '||g.label||', '||to_char(target.date,'DD. MM. YYYY') into subject from public.portal_staff t,public.portal_groups g where t.id=target.coach_id and (t.active or (target.status='closed' and actor.role='admin')) and g.id=target.group_id;
 if exists(select 1 from public.portal_additional_coaches ac join public.portal_staff st on st.id=ac.coach_id where ac.session_id=target.id and ((not st.active and not (target.status='closed' and actor.role='admin')) or ac.coach_id=target.coach_id)) then raise exception 'invalid additional coach';end if;
 if subject is null then raise exception 'inactive coach';end if;
 update public.portal_sessions set first_saved_at=coalesce(first_saved_at,case when status<>'closed' then clock_timestamp() end),entries=packed,comment=note,status='closed',version=version+1,mail_version=case when note='' then null when changed then version+1 else mail_version end,mail_subject=case when note<>'' then subject end,mail_status=case when note='' then 'none' when changed then 'pending' else mail_status end where id=target.id returning * into target;
 update public.portal_outbox set status='superseded' where session_id=target.id and status='pending' and version is distinct from target.mail_version;
 insert into public.portal_audit(session_id,actor,before_value,after_value) values(target.id,actor.id,previous,to_jsonb(target));
 if note<>'' and changed then insert into public.portal_outbox(session_id,version,subject,body) values(target.id,target.version,subject,note); end if;
 return to_jsonb(target);
end $$;

commit;

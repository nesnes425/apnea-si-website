-- Exact migration already recorded in the connected project on October 7, 2026.
alter table public.portal_staff add column welcome text check (welcome in ('Dobrodošla','Dobrodošel'));
update public.portal_staff set welcome=case when name in ('Daša Tičar','Katarina Tavčar') then 'Dobrodošla' when name='Samo Jeranko' then 'Dobrodošel' end where name in ('Daša Tičar','Katarina Tavčar','Samo Jeranko');

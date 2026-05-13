-- Apply this BEFORE the drizzle-generated migration.
-- Both functions below are referenced from the schema (in CHECK constraints
-- and post-migration triggers respectively) and must exist beforehand.

create or replace function public.array_is_sorted_asc_unique(arr int[])
returns boolean
language sql
immutable
as $$
  select
    case
      when arr is null then true
      when array_length(arr, 1) is null then true
      else (
        arr = (select array_agg(x order by x) from unnest(arr) x)
        and array_length(arr, 1) = (select count(distinct x)::int from unnest(arr) x)
      )
    end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

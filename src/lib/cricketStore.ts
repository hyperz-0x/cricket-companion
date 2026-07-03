import { supabase } from '@/integrations/supabase/client';
import { Match, Series } from '@/types/cricket';

export async function fetchAllMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('data, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('fetchAllMatches error', error);
    return [];
  }
  return (data ?? []).map((r: any) => r.data as Match);
}

export async function fetchAllSeries(): Promise<Series[]> {
  const { data, error } = await supabase
    .from('series')
    .select('data, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('fetchAllSeries error', error);
    return [];
  }
  return (data ?? []).map((r: any) => r.data as Series);
}

export async function upsertMatch(match: Match): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .upsert({ id: match.id, data: match as any }, { onConflict: 'id' });
  if (error) console.error('upsertMatch error', error);
}

export async function upsertSeries(series: Series): Promise<void> {
  const { error } = await supabase
    .from('series')
    .upsert({ id: series.id, data: series as any }, { onConflict: 'id' });
  if (error) console.error('upsertSeries error', error);
}

export async function deleteMatchDb(id: string): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) console.error('deleteMatchDb error', error);
}

export async function deleteSeriesDb(id: string): Promise<void> {
  const { error } = await supabase.from('series').delete().eq('id', id);
  if (error) console.error('deleteSeriesDb error', error);
}
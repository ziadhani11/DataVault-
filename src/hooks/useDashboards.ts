import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface Dashboard {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  file_id: string | null;
  chart_config: ChartConfig[];
  created_at: string;
  updated_at: string;
}

export interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  xAxis: string;
  yAxis: string;
}

function parseChartConfig(json: Json | null): ChartConfig[] {
  if (!json) return [];
  if (Array.isArray(json)) {
    return json as unknown as ChartConfig[];
  }
  return [];
}

export function useDashboards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createDashboard = useCallback(async (
    name: string,
    description?: string,
    fileId?: string
  ): Promise<Dashboard | null> => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in to create dashboards.',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('dashboards')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          file_id: fileId || null,
          chart_config: [] as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Dashboard created!',
        description: `"${name}" is ready for customization.`,
      });

      return {
        ...data,
        chart_config: parseChartConfig(data.chart_config),
      } as Dashboard;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create dashboard';
      toast({
        title: 'Creation failed',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const fetchDashboards = useCallback(async (): Promise<Dashboard[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch dashboards:', error);
      return [];
    }

    return (data || []).map(d => ({
      ...d,
      chart_config: parseChartConfig(d.chart_config),
    })) as Dashboard[];
  }, [user]);

  const updateDashboard = useCallback(async (
    id: string,
    updates: { name?: string; description?: string; chart_config?: ChartConfig[] }
  ): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.chart_config !== undefined) dbUpdates.chart_config = updates.chart_config as unknown as Json;

      const { error } = await supabase
        .from('dashboards')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Dashboard updated',
        description: 'Your changes have been saved.',
      });

      return true;
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Could not save changes.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const deleteDashboard = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Dashboard deleted',
        description: 'The dashboard has been removed.',
      });

      return true;
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Could not delete the dashboard.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  return {
    loading,
    createDashboard,
    fetchDashboards,
    updateDashboard,
    deleteDashboard,
  };
}

import { supabase, checkUserRole } from '@/lib/supabase';
import type { Task } from '@/types/database';

export const driverTasksApi = {
  // Get all tasks for the current driver
  getTasks: async () => {
    const user = await checkUserRole('driver');
    const { data, error } = await supabase
      .from('tasks')
      .select('*, orders(*)')
      .eq('driver_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as (Task & { orders: any })[];
  },

  // Get a single task
  getTask: async (taskId: string) => {
    const user = await checkUserRole('driver');
    const { data, error } = await supabase
      .from('tasks')
      .select('*, orders(*)')
      .eq('id', taskId)
      .eq('driver_id', user.id)
      .single();
      
    if (error) throw error;
    return data as Task & { orders: any };
  },

  // Update task status
  updateTaskStatus: async (taskId: string, status: Task['status']) => {
    const user = await checkUserRole('driver');
    const { data, error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId)
      .eq('driver_id', user.id)
      .select()
      .single();
      
    if (error) throw error;
    return data as Task;
  },

  // Accept a task
  acceptTask: async (taskId: string) => {
    const user = await checkUserRole('driver');
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        driver_id: user.id,
        status: 'in_progress'
      })
      .eq('id', taskId)
      .select()
      .single();
      
    if (error) throw error;
    return data as Task;
  }
}; 
/**
 * Database Service Layer
 *
 * This module provides all database operations for the Personal Assistant app.
 * It handles tasks, habits, notes, and goals with proper error handling and type safety.
 */

import { createClient as createBrowserClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import type { Task, Habit, HabitEntry, Note, Goal, DailyCheckin } from '@/types'
import type { Session } from 'next-auth'

/**
 * Create a session-aware Supabase client that respects Row Level Security (RLS)
 * This ensures users can only access their own data
 */
function getSupabaseClient(session?: Session | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration missing for database operations')
    // Return a mock client that doesn't break the app
    return {
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        eq: function() { return this },
        order: function() { return this }
      })
    }
  }

  // Create client with user session for RLS enforcement
  if (session?.accessToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      }
    })
  }

  // Return anonymous client for non-authenticated operations
  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Tasks Service
 */
export class TasksService {
  static async getAll(session?: Session | null): Promise<Task[]> {
    try {
      const supabase = getSupabaseClient(session)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tasks:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Tasks service error:', err)
      return []
    }
  }

  static async create(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>, session?: Session | null): Promise<Task | null> {
    try {
      const supabase = getSupabaseClient(session)
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single()

      if (error) {
        console.error('Error creating task:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Tasks create error:', err)
      return null
    }
  }

  static async update(id: string, task: Partial<Task>, session?: Session | null): Promise<Task | null> {
    try {
      const supabase = getSupabaseClient(session)
      const { data, error } = await supabase
        .from('tasks')
        .update(task)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating task:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Tasks update error:', err)
      return null
    }
  }

  static async delete(id: string, session?: Session | null): Promise<boolean> {
    try {
      const supabase = getSupabaseClient(session)
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting task:', error)
        return false
      }

      return true
    } catch (err) {
      console.error('Tasks delete error:', err)
      return false
    }
  }
}

/**
 * Habits Service
 */
export class HabitsService {
  static async getAll(userId?: string): Promise<Habit[]> {
    try {
      let query = getSupabaseClient()
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching habits:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Habits service error:', err)
      return []
    }
  }

  static async create(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>): Promise<Habit | null> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('habits')
        .insert(habit)
        .select()
        .single()

      if (error) {
        console.error('Error creating habit:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Habits create error:', err)
      return null
    }
  }

  static async update(id: string, habit: Partial<Habit>): Promise<Habit | null> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('habits')
        .update(habit)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating habit:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Habits update error:', err)
      return null
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await getSupabaseClient()
        .from('habits')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting habit:', error)
        return false
      }

      return true
    } catch (err) {
      console.error('Habits delete error:', err)
      return false
    }
  }

  static async logEntry(entry: Omit<HabitEntry, 'id' | 'created_at'>): Promise<HabitEntry | null> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('habit_entries')
        .insert(entry)
        .select()
        .single()

      if (error) {
        console.error('Error logging habit entry:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Habit entry error:', err)
      return null
    }
  }

  static async getEntries(habitId: string, startDate?: string, endDate?: string): Promise<HabitEntry[]> {
    try {
      let query = getSupabaseClient()
        .from('habit_entries')
        .select('*')
        .eq('habit_id', habitId)
        .order('entry_date', { ascending: false })

      if (startDate) {
        query = query.gte('entry_date', startDate)
      }

      if (endDate) {
        query = query.lte('entry_date', endDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching habit entries:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Habit entries service error:', err)
      return []
    }
  }
}

/**
 * Notes Service
 */
export class NotesService {
  static async getAll(userId?: string): Promise<Note[]> {
    try {
      let query = getSupabaseClient()
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching notes:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Notes service error:', err)
      return []
    }
  }

  static async create(note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note | null> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('notes')
        .insert(note)
        .select()
        .single()

      if (error) {
        console.error('Error creating note:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Notes create error:', err)
      return null
    }
  }

  static async update(id: string, note: Partial<Note>): Promise<Note | null> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('notes')
        .update(note)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating note:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Notes update error:', err)
      return null
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await getSupabaseClient()
        .from('notes')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting note:', error)
        return false
      }

      return true
    } catch (err) {
      console.error('Notes delete error:', err)
      return false
    }
  }
}

/**
 * Goals Service
 */
export class GoalsService {
  static async getAll(userId?: string): Promise<Goal[]> {
    try {
      let query = getSupabaseClient()
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching goals:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Goals service error:', err)
      return []
    }
  }

  static async create(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal | null> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('goals')
        .insert(goal)
        .select()
        .single()

      if (error) {
        console.error('Error creating goal:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Goals create error:', err)
      return null
    }
  }

  static async update(id: string, goal: Partial<Goal>): Promise<Goal | null> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('goals')
        .update(goal)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating goal:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Goals update error:', err)
      return null
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await getSupabaseClient()
        .from('goals')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting goal:', error)
        return false
      }

      return true
    } catch (err) {
      console.error('Goals delete error:', err)
      return false
    }
  }
}

/**
 * Daily Check-ins Service
 */
export class DailyCheckinsService {
  static async getToday(userId: string): Promise<DailyCheckin | null> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await getSupabaseClient()
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found - this is expected
          return null
        }
        console.error('Error fetching today checkin:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Daily checkin service error:', err)
      return null
    }
  }

  static async createOrUpdate(
    userId: string,
    checkin: Partial<Omit<DailyCheckin, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<DailyCheckin | null> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await getSupabaseClient()
        .from('daily_checkins')
        .upsert({
          user_id: userId,
          date: today,
          ...checkin
        })
        .select()
        .single()

      if (error) {
        console.error('Error upserting checkin:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Daily checkin upsert error:', err)
      return null
    }
  }

  static async getRecent(userId: string, days: number = 7): Promise<DailyCheckin[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await getSupabaseClient()
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching recent checkins:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Recent checkins service error:', err)
      return []
    }
  }
}
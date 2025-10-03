// Database types for our core entities
export interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  completed_at?: string
  estimated_time?: number
  actual_time?: number
  tags?: string[]
  created_at: string
  updated_at: string
  user_id: string

  // Agent-related fields
  created_by_agent?: string
  agent_confidence?: number
  source_email_id?: string
  estimated_effort_minutes?: number
}

export interface Habit {
  id: string
  name: string
  description?: string
  category?: string
  frequency: 'daily' | 'weekly' | 'monthly'
  target_count: number
  is_active: boolean
  icon?: string
  color?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface HabitEntry {
  id: string
  habit_id: string
  completed_date: string
  completed_at: string
  notes?: string
  entry_date?: string
}

export interface DailyCheckin {
  id: string
  user_id: string
  date: string
  wake_time?: string
  sleep_time?: string
  day_rating: number // 1-10 scale
  mood?: string
  notes?: string
  habits_completed: string[] // habit_ids
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  title: string
  content: string
  category: 'general' | 'todo' | 'idea' | 'people' | 'meeting'
  tags?: string[]
  created_at: string
  updated_at: string
  user_id: string
  is_archived: boolean
}

export interface Goal {
  id: string
  title: string
  description?: string
  target_date?: string
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  progress_percentage: number
  created_at: string
  updated_at: string
  user_id: string
  category?: string
}

// Voice-related types
export interface VoiceCommand {
  action: 'create_task' | 'create_habit' | 'create_note' | 'mark_complete' | 'get_summary'
  entity: 'task' | 'habit' | 'note' | 'goal'
  content: string
  metadata?: Record<string, any>
}

export interface VoiceResponse {
  message: string
  action_taken?: string
  data?: any
}

// UI Component types
export interface DashboardStats {
  tasks_pending: number
  tasks_completed_today: number
  habits_completed_today: number
  current_streaks: number
  upcoming_deadlines: number
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
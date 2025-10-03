'use client'

import { useState, useEffect } from 'react'
import { Target, Flame, Plus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { HabitsService } from '@/lib/database'
import { useUser } from '@/hooks/useUser'
import GoogleAccountPrompt from './GoogleAccountPrompt'
import type { Habit, HabitEntry } from '@/types'

interface HabitTrackerProps {
  className?: string
}

export function HabitTracker({ className }: HabitTrackerProps) {
  const { user, isAuthenticated, isLoading: userLoading } = useUser()
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<HabitEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [newHabitName, setNewHabitName] = useState('')
  const today = new Date().toISOString().split('T')[0]

  // Load habits when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadHabits()
    } else if (!userLoading && !isAuthenticated) {
      setLoading(false)
      setHabits([])
      setEntries([])
    }
  }, [isAuthenticated, user, userLoading])

  const loadHabits = async () => {
    setLoading(true)
    try {
      const fetchedHabits = await HabitsService.getAll()
      setHabits(fetchedHabits)

      // Load entries for all habits
      const allEntries: HabitEntry[] = []
      for (const habit of fetchedHabits) {
        const habitEntries = await HabitsService.getEntries(habit.id, today, today)
        allEntries.push(...habitEntries)
      }
      setEntries(allEntries)
    } catch (error) {
      console.error('Failed to load habits:', error)
    } finally {
      setLoading(false)
    }
  }

  const addHabit = async () => {
    if (!newHabitName.trim() || !user) return

    const newHabit = {
      name: newHabitName,
      frequency: 'daily' as const,
      target_count: 1,
      user_id: user.id,
      is_active: true
    }

    try {
      const createdHabit = await HabitsService.create(newHabit)
      if (createdHabit) {
        setHabits([createdHabit, ...habits])
        setNewHabitName('')
      }
    } catch (error) {
      console.error('Failed to create habit:', error)
      alert('Failed to create habit. Please try again.')
    }
  }

  const toggleHabitCompletion = async (habitId: string) => {
    if (!user) return

    const existingEntry = entries.find(e => e.habit_id === habitId && e.completed_date === today)

    try {
      const entryData = {
        habit_id: habitId,
        completed_date: today,
        completed_at: new Date().toISOString(),
        user_id: user.id
      }

      const createdEntry = await HabitsService.createEntry(entryData)

      if (createdEntry) {
        if (existingEntry) {
          setEntries(entries.map(entry =>
            entry.id === existingEntry.id ? createdEntry : entry
          ))
        } else {
          setEntries([...entries, createdEntry])
        }
      }
    } catch (error) {
      console.error('Failed to update habit entry:', error)
      alert('Failed to update habit. Please try again.')
    }

    // Note: Streak calculation is handled by database triggers in the real app
    // For now, we'll update streaks locally
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const todayEntry = entries.find(e => e.habit_id === habitId && e.completed_date === today)
        const willBeCompleted = !todayEntry

        return {
          ...habit,
          // Note: streak functionality temporarily disabled until database schema includes streak fields
          updated_at: new Date().toISOString()
        }
      }
      return habit
    }))
  }

  const getHabitStatusForDate = (habitId: string, date: string) => {
    const entry = entries.find(e => e.habit_id === habitId && e.completed_date === date)
    return !!entry
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 10) return '🔥'
    if (streak >= 5) return '⚡'
    if (streak >= 3) return '✨'
    return '💪'
  }

  const completedToday = habits.filter(habit =>
    getHabitStatusForDate(habit.id, today)
  ).length

  // Show authentication prompt if not authenticated
  if (!isAuthenticated && !userLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Habit Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GoogleAccountPrompt compact />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Habit Tracker
          </div>
          <div className="flex gap-2 text-sm">
            <Badge variant="default">{completedToday}/{habits.length} today</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Habit */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a new habit..."
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addHabit()
              }
            }}
            className="flex-1"
            data-testid="habit-input"
          />
          <Button onClick={addHabit} size="icon" data-testid="habit-add-button">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Habits List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading habits...
            </div>
          ) : habits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No habits yet. Add one to get started!
            </div>
          ) : (
            habits.map(habit => {
              const isCompletedToday = getHabitStatusForDate(habit.id, today)

              return (
                <div
                  key={habit.id}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border transition-colors",
                    isCompletedToday ? "bg-green-50 border-green-200" : "bg-background hover:bg-muted/50"
                  )}
                >
                  <button
                    onClick={() => toggleHabitCompletion(habit.id)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                      isCompletedToday
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-muted-foreground hover:border-primary"
                    )}
                    data-testid="habit-circle"
                  >
                    {isCompletedToday && <Check className="h-4 w-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        "font-medium text-sm",
                        isCompletedToday && "text-green-700"
                      )}>
                        {habit.name}
                      </h4>
                      {/* Streak display temporarily disabled */}
                    </div>

                    {habit.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {habit.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Frequency: {habit.frequency}</span>
                      <span>Track your progress daily</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={cn(
                      "text-lg font-bold",
                      isCompletedToday ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {isCompletedToday ? "✓" : "○"}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Weekly Overview */}
        {habits.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-3">This Week</h4>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-center font-medium text-muted-foreground p-1">
                  {day}
                </div>
              ))}
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() - (6 - i))
                const dateStr = date.toISOString().split('T')[0]
                const completedHabits = habits.filter(habit =>
                  getHabitStatusForDate(habit.id, dateStr)
                ).length

                return (
                  <div
                    key={i}
                    className={cn(
                      "text-center p-1 rounded text-xs",
                      completedHabits === habits.length ? "bg-green-500 text-white" :
                      completedHabits > 0 ? "bg-green-200 text-green-800" :
                      "bg-muted text-muted-foreground"
                    )}
                  >
                    {completedHabits}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
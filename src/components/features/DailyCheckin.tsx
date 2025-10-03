'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Moon, Sun, Star } from 'lucide-react'
import type { DailyCheckin as DailyCheckinType, Habit } from '@/types'

interface DailyCheckinProps {
  habits: Habit[]
  onUpdate?: () => void
}

export function DailyCheckin({ habits, onUpdate }: DailyCheckinProps) {
  const [checkin, setCheckin] = useState<DailyCheckinType | null>(null)
  const [wakeTime, setWakeTime] = useState('')
  const [sleepTime, setSleepTime] = useState('')
  const [dayRating, setDayRating] = useState<number>(0)
  const [completedHabits, setCompletedHabits] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchTodayCheckin()
  }, [])

  const fetchTodayCheckin = async () => {
    try {
      const response = await fetch('/api/checkin')
      const data = await response.json()

      if (data.checkin) {
        setCheckin(data.checkin)
        setWakeTime(data.checkin.wake_time || '')
        setSleepTime(data.checkin.sleep_time || '')
        setDayRating(data.checkin.day_rating || 0)
        setCompletedHabits(new Set(data.checkin.habits_completed || []))
      }
    } catch (error) {
      console.error('Error fetching checkin:', error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wake_time: wakeTime,
          sleep_time: sleepTime,
          day_rating: dayRating,
          habits_completed: Array.from(completedHabits)
        })
      })

      onUpdate?.()
      fetchTodayCheckin()
    } catch (error) {
      console.error('Error saving checkin:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleHabit = (habitId: string) => {
    const newCompleted = new Set(completedHabits)
    if (newCompleted.has(habitId)) {
      newCompleted.delete(habitId)
    } else {
      newCompleted.add(habitId)
    }
    setCompletedHabits(newCompleted)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Daily Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sleep Tracking */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Sun className="h-4 w-4" />
              Wake Up Time
            </label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Moon className="h-4 w-4" />
              Bedtime
            </label>
            <input
              type="time"
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        {/* Day Rating */}
        <div>
          <label className="text-sm font-medium flex items-center gap-2 mb-3">
            <Star className="h-4 w-4" />
            How was your day? (1-10)
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
              <button
                key={rating}
                onClick={() => setDayRating(rating)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  dayRating >= rating
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-gray-100 border-gray-300 hover:border-blue-400'
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
        </div>

        {/* Habits Checklist */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Today's Habits
          </label>
          <div className="space-y-2">
            {habits.filter(h => h.is_active).map((habit) => (
              <div
                key={habit.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleHabit(habit.id)}
              >
                <input
                  type="checkbox"
                  checked={completedHabits.has(habit.id)}
                  onChange={() => toggleHabit(habit.id)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-2xl">{habit.icon}</span>
                <span className={completedHabits.has(habit.id) ? 'line-through text-gray-500' : ''}>
                  {habit.name}
                </span>
                {completedHabits.has(habit.id) && (
                  <Badge className="ml-auto">✓</Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>Completed: {completedHabits.size}/{habits.filter(h => h.is_active).length} habits</span>
            {dayRating > 0 && (
              <span className="flex items-center gap-1">
                Day rating: <strong>{dayRating}/10</strong>
              </span>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Saving...' : 'Save Check-in'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

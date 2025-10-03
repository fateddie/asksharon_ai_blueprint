'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle, Circle, Calendar, Flag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TasksService } from '@/lib/database'
import { useUser } from '@/hooks/useUser'
import GoogleAccountPrompt from './GoogleAccountPrompt'
import type { Task } from '@/types'

interface TaskManagerProps {
  className?: string
}

export function TaskManager({ className }: TaskManagerProps) {
  const { user, isAuthenticated, isLoading: userLoading } = useUser()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  // Load tasks when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadTasks()
    } else if (!userLoading && !isAuthenticated) {
      setLoading(false)
      setTasks([])
    }
  }, [isAuthenticated, user, userLoading])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const fetchedTasks = await TasksService.getAll()
      setTasks(fetchedTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async () => {
    if (!newTaskTitle.trim() || !user) return

    const newTask = {
      title: newTaskTitle,
      status: 'pending' as const,
      priority: 'medium' as const,
      user_id: user.id
    }

    try {
      const createdTask = await TasksService.create(newTask)
      if (createdTask) {
        setTasks([createdTask, ...tasks])
        setNewTaskTitle('')
      }
    } catch (error) {
      console.error('Failed to create task:', error)
      // Show user-friendly error message instead of fallback
      alert('Failed to create task. Please try again.')
    }
  }

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const newStatus: 'pending' | 'completed' = task.status === 'completed' ? 'pending' : 'completed'
    const updates = {
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined
    }

    try {
      const updatedTask = await TasksService.update(id, updates)
      if (updatedTask) {
        setTasks(tasks.map(t => t.id === id ? updatedTask : t))
      }
    } catch (error) {
      console.error('Failed to update task:', error)
      alert('Failed to update task. Please try again.')
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const success = await TasksService.delete(id)
      if (success) {
        setTasks(tasks.filter(task => task.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete task:', error)
      alert('Failed to delete task. Please try again.')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'pending': return task.status === 'pending' || task.status === 'in_progress'
      case 'completed': return task.status === 'completed'
      default: return true
    }
  })

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
  }

  // Show authentication prompt if not authenticated
  if (!isAuthenticated && !userLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Task Manager
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
            <CheckCircle className="h-5 w-5" />
            Task Manager
          </div>
          <div className="flex gap-2 text-sm">
            <Badge variant="outline">{stats.pending} pending</Badge>
            <Badge variant="default">{stats.completed} done</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Task */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTask()
              }
            }}
            className="flex-1"
            data-testid="task-input"
          />
          <Button onClick={addTask} size="icon" data-testid="task-add-button">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 border-b">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'completed', label: 'Completed' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(key as any)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                  task.status === 'completed' ? "bg-muted/50" : "bg-background hover:bg-muted/50"
                )}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mt-0.5 text-primary hover:text-primary/80"
                  data-testid="task-circle"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 fill-current" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn(
                      "font-medium text-sm",
                      task.status === 'completed' && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </h4>
                    <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                      <Flag className="h-3 w-3 mr-1" />
                      {task.priority}
                    </Badge>
                  </div>

                  {task.description && (
                    <p className={cn(
                      "text-xs text-muted-foreground mb-2",
                      task.status === 'completed' && "line-through"
                    )}>
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex gap-1">
                        {task.tags.map(tag => (
                          <span key={tag} className="px-1 py-0.5 bg-muted rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTask(task.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { processVoiceCommand, generateVoiceResponse } from '@/lib/openai'
import { TasksService, HabitsService, DailyCheckinsService } from '@/lib/database'
import { generateUserUUID } from '@/lib/uuid'
import { CalendarService } from '@/lib/calendar'
import { GmailService } from '@/lib/gmail'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transcript } = await request.json()
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript required' }, { status: 400 })
    }

    // Process voice command with OpenAI
    const command = await processVoiceCommand(transcript)
    const userId = generateUserUUID(session.user.email)

    let result: any = { success: false }

    // Execute command based on intent
    switch (command.intent) {
      case 'create_task':
        if (command.entities.taskTitle) {
          const task = await TasksService.create({
            user_id: userId,
            title: command.entities.taskTitle,
            status: 'pending',
            priority: command.entities.priority || 'medium',
            due_date: command.entities.dueDate || undefined
          })

          result = {
            success: !!task,
            task,
            message: task ? `Task "${command.entities.taskTitle}" created` : 'Failed to create task'
          }
        }
        break

      case 'create_habit':
        if (command.entities.habitName) {
          const habit = await HabitsService.create({
            user_id: userId,
            name: command.entities.habitName,
            frequency: command.entities.frequency || 'daily',
            target_count: 1,
            is_active: true
          })

          result = {
            success: !!habit,
            habit,
            message: habit ? `Habit "${command.entities.habitName}" added` : 'Failed to create habit'
          }
        }
        break

      case 'query_status':
        // Get user's current status
        const tasks = await TasksService.getAll()
        const habits = await HabitsService.getAll()

        result = {
          success: true,
          data: {
            tasks: {
              total: tasks.length,
              pending: tasks.filter(t => t.status === 'pending').length,
              completed: tasks.filter(t => t.status === 'completed').length
            },
            habits: {
              total: habits.length,
              active: habits.filter(h => h.is_active).length
            }
          },
          message: `You have ${tasks.filter(t => t.status === 'pending').length} pending tasks and ${habits.filter(h => h.is_active).length} active habits`
        }
        break

      case 'set_reminder':
        // For now, treat reminders as tasks with due dates
        if (command.entities.taskTitle) {
          const task = await TasksService.create({
            user_id: userId,
            title: command.entities.taskTitle,
            status: 'pending',
            priority: 'medium',
            due_date: command.entities.dueDate || undefined
          })

          result = {
            success: !!task,
            task,
            message: task ? `Reminder set for "${command.entities.taskTitle}"` : 'Failed to set reminder'
          }
        }
        break

      case 'create_event':
        if (session.accessToken && command.entities.eventTitle) {
          try {
            const calendar = new CalendarService(session.accessToken, session.refreshToken)

            // Parse date and time
            const eventDate = command.entities.eventDate || new Date().toISOString()
            const eventTime = command.entities.eventTime || '09:00'
            const duration = parseInt(command.entities.eventDuration || '60')

            const startTime = new Date(`${eventDate.split('T')[0]}T${eventTime}`)
            const endTime = new Date(startTime.getTime() + duration * 60000)

            const event = await calendar.createEvent({
              id: '',
              title: command.entities.eventTitle,
              description: '',
              location: command.entities.eventLocation || '',
              startTime,
              endTime,
              isAllDay: false,
              attendees: (command.entities.eventAttendees || []).map(email => ({ email })),
              status: 'confirmed',
              visibility: 'default'
            })

            result = {
              success: true,
              event,
              message: `Calendar event "${command.entities.eventTitle}" created for ${startTime.toLocaleString()}`
            }
          } catch (error) {
            result = {
              success: false,
              message: 'Failed to create calendar event'
            }
          }
        } else {
          result = {
            success: false,
            message: 'Please connect your Google Calendar first'
          }
        }
        break

      case 'query_calendar':
        if (session.accessToken) {
          try {
            const calendar = new CalendarService(session.accessToken, session.refreshToken)
            const timeMin = new Date()
            const timeMax = new Date()
            timeMax.setDate(timeMax.getDate() + 7)

            const events = await calendar.getEvents('primary', timeMin, timeMax, 10)

            result = {
              success: true,
              events,
              message: `You have ${events.length} upcoming events`
            }
          } catch (error) {
            result = {
              success: false,
              message: 'Failed to fetch calendar events'
            }
          }
        } else {
          result = {
            success: false,
            message: 'Please connect your Google Calendar first'
          }
        }
        break

      case 'send_email':
        if (session.accessToken && command.entities.emailRecipient && command.entities.emailBody) {
          try {
            const gmail = new GmailService(session.accessToken, session.refreshToken)
            const subject = command.entities.emailSubject || 'Message from Personal Assistant'

            const sent = await gmail.sendEmail(
              command.entities.emailRecipient,
              subject,
              command.entities.emailBody
            )

            result = {
              success: sent,
              message: sent ? `Email sent to ${command.entities.emailRecipient}` : 'Failed to send email'
            }
          } catch (error) {
            result = {
              success: false,
              message: 'Failed to send email'
            }
          }
        } else {
          result = {
            success: false,
            message: 'Please connect your Gmail account first'
          }
        }
        break

      case 'read_emails':
      case 'query_inbox':
        if (session.accessToken) {
          try {
            const gmail = new GmailService(session.accessToken, session.refreshToken)
            const count = command.entities.emailCount || 5
            const messages = await gmail.getMessages(count, 'UNREAD')

            result = {
              success: true,
              emails: messages,
              message: `You have ${messages.length} unread emails`
            }
          } catch (error) {
            result = {
              success: false,
              message: 'Failed to fetch emails'
            }
          }
        } else {
          result = {
            success: false,
            message: 'Please connect your Gmail account first'
          }
        }
        break

      case 'complete_habit':
        if (command.entities.habitName) {
          try {
            // Find habit by name
            const habits = await HabitsService.getAll(userId)
            const habit = habits.find(h =>
              h.name.toLowerCase().includes(command.entities.habitName!.toLowerCase())
            )

            if (habit) {
              const entry = await HabitsService.logEntry({
                habit_id: habit.id,
                completed_date: new Date().toISOString(),
                completed_at: new Date().toISOString()
              })

              result = {
                success: !!entry,
                habit,
                message: entry ? `Great! Marked ${habit.name} as complete` : 'Failed to log habit'
              }
            } else {
              result = {
                success: false,
                message: `Couldn't find habit: ${command.entities.habitName}`
              }
            }
          } catch (error) {
            result = {
              success: false,
              message: 'Failed to complete habit'
            }
          }
        }
        break

      case 'log_sleep':
        try {
          const checkin = await DailyCheckinsService.createOrUpdate(userId, {
            wake_time: command.entities.wakeTime,
            sleep_time: command.entities.sleepTime
          })

          result = {
            success: !!checkin,
            checkin,
            message: checkin ? 'Sleep times logged successfully' : 'Failed to log sleep times'
          }
        } catch (error) {
          result = {
            success: false,
            message: 'Failed to log sleep times'
          }
        }
        break

      case 'rate_day':
        if (command.entities.dayRating) {
          try {
            const checkin = await DailyCheckinsService.createOrUpdate(userId, {
              day_rating: command.entities.dayRating
            })

            result = {
              success: !!checkin,
              checkin,
              message: checkin ? `Day rated ${command.entities.dayRating}/10` : 'Failed to rate day'
            }
          } catch (error) {
            result = {
              success: false,
              message: 'Failed to rate day'
            }
          }
        }
        break

      case 'daily_checkin':
        try {
          const checkin = await DailyCheckinsService.getToday(userId)
          const habits = await HabitsService.getAll(userId)
          const activeHabits = habits.filter(h => h.is_active)

          result = {
            success: true,
            checkin,
            habits: activeHabits,
            message: `Let's do your daily check-in! You have ${activeHabits.length} habits to track today`
          }
        } catch (error) {
          result = {
            success: false,
            message: 'Failed to start daily check-in'
          }
        }
        break

      default:
        result = {
          success: false,
          message: 'Sorry, I didn\'t understand that command'
        }
    }

    // Generate natural language response
    const response = await generateVoiceResponse(command, result)

    return NextResponse.json({
      success: true,
      command,
      result,
      response
    })

  } catch (error) {
    console.error('Voice processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process voice command', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

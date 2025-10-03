'use client'

import { useState } from 'react'
import { Calendar, CheckSquare, Target, PenTool, BarChart, Mail, Menu, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Habits', href: '/habits', icon: Target },
  { name: 'Notes', href: '/notes', icon: PenTool },
  { name: 'Email', href: '/email', icon: Mail },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      "bg-background border-r transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.name}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2",
                collapsed && "px-2"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Button>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 mt-auto border-t">
          <div className="text-sm text-muted-foreground">
            <p>Today's Progress</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Tasks</span>
                <span>3/5</span>
              </div>
              <div className="flex justify-between">
                <span>Habits</span>
                <span>2/3</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
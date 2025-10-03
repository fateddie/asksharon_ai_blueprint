'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Trash2, Star, StarOff, RefreshCw, Plus, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface EmailAccount {
  id: string
  email_address: string
  provider: string
  is_primary: boolean
  is_active: boolean
  last_sync: string | null
  sync_status: 'pending' | 'syncing' | 'completed' | 'error'
  created_at: string
}

export default function AccountManager() {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) {
      fetchAccounts()
    }
  }, [session])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/email/accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccount = async () => {
    try {
      await signIn('google', {
        callbackUrl: window.location.href,
        redirect: false
      })
      // The OAuth flow will handle adding the account
      // We'll refresh the accounts list after successful auth
      setTimeout(fetchAccounts, 2000)
    } catch (error) {
      console.error('Error adding account:', error)
    }
  }

  const handleSetPrimary = async (accountId: string) => {
    try {
      const response = await fetch(`/api/email/accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_primary: true
        })
      })

      if (response.ok) {
        fetchAccounts()
      }
    } catch (error) {
      console.error('Error setting primary account:', error)
    }
  }

  const handleToggleActive = async (accountId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/email/accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !isActive
        })
      })

      if (response.ok) {
        fetchAccounts()
      }
    } catch (error) {
      console.error('Error toggling account status:', error)
    }
  }

  const handleDeleteAccount = async (accountId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove the account ${email}? This will delete all associated email data.`)) {
      return
    }

    try {
      const response = await fetch(`/api/email/accounts/${accountId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchAccounts()
      }
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  const handleSyncAccount = async (accountId: string) => {
    try {
      // Update sync status to 'syncing'
      setAccounts(prev => prev.map(acc =>
        acc.id === accountId
          ? { ...acc, sync_status: 'syncing' as const }
          : acc
      ))

      // Trigger a sync by fetching messages
      const response = await fetch(`/api/email/messages?accountId=${accountId}&maxResults=50`)

      if (response.ok) {
        // Refresh accounts to get updated sync status
        setTimeout(fetchAccounts, 1000)
      } else {
        setAccounts(prev => prev.map(acc =>
          acc.id === accountId
            ? { ...acc, sync_status: 'error' as const }
            : acc
        ))
      }
    } catch (error) {
      console.error('Error syncing account:', error)
      setAccounts(prev => prev.map(acc =>
        acc.id === accountId
          ? { ...acc, sync_status: 'error' as const }
          : acc
      ))
    }
  }

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getSyncStatusText = (status: string, lastSync: string | null) => {
    switch (status) {
      case 'completed':
        return lastSync
          ? `Synced ${new Date(lastSync).toLocaleString()}`
          : 'Synced successfully'
      case 'error':
        return 'Sync failed'
      case 'syncing':
        return 'Syncing...'
      default:
        return 'Pending sync'
    }
  }

  if (!session) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Account Management</h3>
          <p className="text-gray-600 mb-4">Sign in to manage your email accounts</p>
          <Button onClick={() => signIn('google')}>
            Sign In with Google
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Connected Accounts</h3>
            <p className="text-gray-600">Manage your Gmail and Calendar accounts</p>
          </div>
          <Button
            onClick={handleAddAccount}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="loading loading-spinner loading-md"></div>
            <p className="mt-2 text-gray-600">Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">No accounts connected yet</p>
            <Button onClick={handleAddAccount} className="btn btn-outline">
              Connect Your First Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`p-4 border rounded-lg ${
                  account.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{account.email_address}</h4>

                      <div className="flex gap-1">
                        {account.is_primary && (
                          <Badge className="badge-primary text-xs">
                            Primary
                          </Badge>
                        )}

                        <Badge
                          variant={account.is_active ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {account.is_active ? 'Active' : 'Inactive'}
                        </Badge>

                        <Badge variant="outline" className="text-xs">
                          {account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {getSyncStatusIcon(account.sync_status)}
                      <span>{getSyncStatusText(account.sync_status, account.last_sync)}</span>
                    </div>

                    <p className="text-xs text-gray-400 mt-1">
                      Added {new Date(account.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Sync Button */}
                    <button
                      onClick={() => handleSyncAccount(account.id)}
                      disabled={account.sync_status === 'syncing' || !account.is_active}
                      className="btn btn-ghost btn-sm"
                      title="Sync now"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${
                          account.sync_status === 'syncing' ? 'animate-spin' : ''
                        }`}
                      />
                    </button>

                    {/* Set Primary Button */}
                    {!account.is_primary && account.is_active && (
                      <button
                        onClick={() => handleSetPrimary(account.id)}
                        className="btn btn-ghost btn-sm"
                        title="Set as primary account"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    )}

                    {/* Toggle Active Button */}
                    <button
                      onClick={() => handleToggleActive(account.id, account.is_active)}
                      disabled={account.is_primary}
                      className="btn btn-ghost btn-sm"
                      title={account.is_active ? 'Deactivate account' : 'Activate account'}
                    >
                      {account.is_active ? (
                        <StarOff className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteAccount(account.id, account.email_address)}
                      disabled={account.is_primary}
                      className="btn btn-ghost btn-sm text-red-500"
                      title="Remove account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {account.is_primary && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-700">
                      This is your primary account. It cannot be deactivated or deleted.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {accounts.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Account Management Tips</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your primary account is used by default for sending emails and creating calendar events</li>
              <li>• Inactive accounts won't sync new messages but existing data remains accessible</li>
              <li>• You can switch between accounts in the Email and Calendar sections</li>
              <li>• Sync runs automatically, but you can trigger manual syncs anytime</li>
            </ul>
          </div>
        )}
      </Card>
    </div>
  )
}
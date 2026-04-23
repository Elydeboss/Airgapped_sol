'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield,
  Users,
  FileText,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'

// Mock data for development
const mockStats = {
  totalUsers: 127,
  activeUsers: 89,
  pendingApprovals: 12,
  policyViolations: 3,
  totalTransactions: 1247,
  todayVolume: 45600, // SOL
}

const mockRecentActivity = [
  { id: 1, type: 'approval', user: 'alice@company.com', action: 'Transaction approved', time: '2 minutes ago', status: 'success' },
  { id: 2, type: 'policy_violation', user: 'bob@company.com', action: 'Amount limit exceeded', time: '15 minutes ago', status: 'error' },
  { id: 3, type: 'user_login', user: 'charlie@company.com', action: 'Admin login', time: '1 hour ago', status: 'success' },
  { id: 4, type: 'approval', user: 'david@company.com', action: 'Workflow created', time: '2 hours ago', status: 'pending' },
  { id: 5, type: 'policy_change', user: 'admin@company.com', action: 'Policy updated', time: '3 hours ago', status: 'success' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(mockStats)
  const [recentActivity, setRecentActivity] = useState(mockRecentActivity)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // In production, fetch from API
        // const response = await fetch('/api/admin/dashboard')
        // const data = await response.json()
        // setStats(data.stats)
        // setRecentActivity(data.activity)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return Shield
      case 'policy_violation':
        return AlertTriangle
      case 'user_login':
        return Users
      case 'policy_change':
        return Settings
      default:
        return Activity
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      case 'pending':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">Enterprise Admin Dashboard</h1>
          <p className="text-gray-400">Manage users, policies, and monitor system activity</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
              <p className="mt-1 text-sm text-green-400">{stats.activeUsers} active</p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{stats.pendingApprovals}</div>
              <p className="mt-1 text-sm text-gray-400">Require action</p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Policy Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{stats.policyViolations}</div>
              <p className="mt-1 text-sm text-gray-400">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Today's Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.todayVolume.toLocaleString()}</div>
              <p className="mt-1 text-sm text-gray-400">SOL</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-black/20">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Recent Activity */}
            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">Latest system events and actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = getActivityIcon(activity.type)
                    return (
                      <div key={activity.id} className="flex items-center gap-4 rounded-lg bg-white/5 p-4">
                        <div className={`rounded-full bg-white/10 p-2 ${getStatusColor(activity.status)}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{activity.action}</p>
                          <p className="text-sm text-gray-400">{activity.user} • {activity.time}</p>
                        </div>
                        <div className="text-right">
                          {activity.status === 'success' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {activity.status === 'error' && (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          {activity.status === 'pending' && (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Create User</CardTitle>
                  <CardDescription className="text-gray-400">Add new team member</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Users className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">New Policy</CardTitle>
                  <CardDescription className="text-gray-400">Create governance rule</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <FileText className="mr-2 h-4 w-4" />
                    Create Policy
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Generate Report</CardTitle>
                  <CardDescription className="text-gray-400">Export compliance data</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Activity className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals">
            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Pending Approvals</CardTitle>
                <CardDescription className="text-gray-400">Workflows awaiting your approval</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Approval workflow component will be rendered here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies">
            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Active Policies</CardTitle>
                <CardDescription className="text-gray-400">Manage governance and compliance rules</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Policy management component will be rendered here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
                <CardDescription className="text-gray-400">Manage team members and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">User management component will be rendered here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Audit Logs</CardTitle>
                <CardDescription className="text-gray-400">Immutable compliance trail</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Audit log viewer component will be rendered here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

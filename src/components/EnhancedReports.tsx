import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/hooks/useUserRole';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Package, Truck, Users, MapPin, Clock } from 'lucide-react';

interface EnhancedReportsProps {
  userRole: UserRole;
  userId: string;
}

export const EnhancedReports = ({ userRole, userId }: EnhancedReportsProps) => {
  const [reportData, setReportData] = useState<any>({
    totalShipments: 0,
    pendingShipments: 0,
    completedShipments: 0,
    inTransitShipments: 0,
    monthlyStats: [],
    statusDistribution: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [userId, userRole]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch shipments based on user role
      let shipmentsQuery = supabase.from('shipments').select('*');
      
      // Role-based filtering
      if (userRole !== 'administrator') {
        shipmentsQuery = shipmentsQuery.eq('user_id', userId);
      }

      const { data: shipments, error } = await shipmentsQuery;

      if (error) throw error;

      // Process data for reports
      const totalShipments = shipments?.length || 0;
      const pendingShipments = shipments?.filter(s => s.status === 'pending').length || 0;
      const completedShipments = shipments?.filter(s => s.status === 'completed').length || 0;
      const inTransitShipments = shipments?.filter(s => s.status === 'in-transit').length || 0;

      // Status distribution for pie chart
      const statusDistribution = [
        { name: 'Pending', value: pendingShipments, color: '#f59e0b' },
        { name: 'In Transit', value: inTransitShipments, color: '#3b82f6' },
        { name: 'Completed', value: completedShipments, color: '#10b981' }
      ].filter(item => item.value > 0);

      // Monthly statistics (mock data for demonstration)
      const monthlyStats = [
        { month: 'Jan', shipments: Math.floor(totalShipments * 0.1), revenue: 12000 },
        { month: 'Feb', shipments: Math.floor(totalShipments * 0.15), revenue: 15000 },
        { month: 'Mar', shipments: Math.floor(totalShipments * 0.2), revenue: 18000 },
        { month: 'Apr', shipments: Math.floor(totalShipments * 0.25), revenue: 22000 },
        { month: 'May', shipments: Math.floor(totalShipments * 0.3), revenue: 28000 }
      ];

      // Recent activity
      const recentActivity = shipments?.slice(0, 5).map(shipment => ({
        id: shipment.id,
        title: shipment.title,
        status: shipment.status,
        created_at: shipment.created_at
      })) || [];

      setReportData({
        totalShipments,
        pendingShipments,
        completedShipments,
        inTransitShipments,
        monthlyStats,
        statusDistribution,
        recentActivity
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getRoleBasedTitle = () => {
    switch (userRole) {
      case 'administrator':
        return 'System Administration Reports';
      case 'farmer':
        return 'Farm Shipment Reports';
      case 'transporter':
        return 'Transportation Reports';
      default:
        return 'Reports Dashboard';
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{getRoleBasedTitle()}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="capitalize">
              {userRole}
            </Badge>
            {userRole === 'administrator' && (
              <Badge variant="outline">Full Access</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalShipments}</div>
            <p className="text-xs text-muted-foreground">
              {userRole === 'administrator' ? 'All shipments' : 'Your shipments'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.inTransitShipments}</div>
            <p className="text-xs text-muted-foreground">Currently moving</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.completedShipments}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.pendingShipments}</div>
            <p className="text-xs text-muted-foreground">Awaiting dispatch</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          {userRole === 'administrator' && (
            <TabsTrigger value="admin">Admin Panel</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Shipment Status Distribution</CardTitle>
                <CardDescription>Breakdown of shipment statuses</CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData.statusDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No shipment data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Shipments</CardTitle>
                <CardDescription>Shipment volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="shipments" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Revenue and shipment trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportData.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="shipments" stroke="hsl(var(--secondary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest shipments and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {reportData.recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          activity.status === 'completed' ? 'default' : 
                          activity.status === 'in-transit' ? 'secondary' : 
                          'outline'
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity to display
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === 'administrator' && (
          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Administrator Tools</CardTitle>
                <CardDescription>System management and user oversight</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold">User Management</h3>
                    <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Package className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold">System Reports</h3>
                    <p className="text-sm text-muted-foreground">Access comprehensive system analytics</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <TrendingUp className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold">Performance Metrics</h3>
                    <p className="text-sm text-muted-foreground">Monitor system performance and usage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
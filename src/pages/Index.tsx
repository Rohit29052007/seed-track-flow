import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import GoogleMap from '@/components/GoogleMap';
import { EnhancedReports } from '@/components/EnhancedReports';
import { RoleSelection } from '@/components/RoleSelection';
import { Menu, Package, BarChart3, Package2, LogOut, X, Shield, Wheat, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Utility Components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

const MessageModal = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
      <p className="text-card-foreground mb-4">{message}</p>
      <Button onClick={onClose} className="w-full">
        Close
      </Button>
    </div>
  </div>
);

// Page Components
const Dashboard = ({ userId, userRole }: { userId: string; userRole: string }) => {
  const [shipmentCount, setShipmentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipmentCount = async () => {
      try {
        let query = supabase.from('shipments').select('*', { count: 'exact' });
        
        if (userRole !== 'administrator') {
          query = query.eq('user_id', userId);
        }

        const { count, error } = await query;

        if (error) throw error;
        setShipmentCount(count || 0);
      } catch (error) {
        console.error('Error fetching shipments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShipmentCount();
  }, [userId, userRole]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const getRoleWelcomeMessage = () => {
    switch (userRole) {
      case 'administrator':
        return 'Welcome, Administrator! You have full system access.';
      case 'farmer':
        return 'Welcome, Farmer! Manage your oil seed shipments and track deliveries.';
      case 'transporter':
        return 'Welcome, Transporter! View assigned shipments and update delivery status.';
      default:
        return 'Welcome to Seed Track Flow!';
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">{getRoleWelcomeMessage()}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg shadow-card border">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            {userRole === 'administrator' ? 'Total System Shipments' : 'Your Shipments'}
          </h2>
          <p className="text-3xl font-bold text-primary">{shipmentCount}</p>
          <p className="text-muted-foreground">Active shipments in the system</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-card border">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">Your Role</h2>
          <Badge className="text-sm" variant="secondary">
            {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
          </Badge>
          <p className="text-muted-foreground mt-2">Current system role</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-card border">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">Quick Actions</h2>
          <p className="text-muted-foreground">
            Use the sidebar to navigate to {userRole === 'farmer' || userRole === 'administrator' ? 'Shipments, ' : ''}
            Reports{userRole === 'administrator' ? ', and Inventory' : ''}.
          </p>
        </div>
      </div>
    </div>
  );
};

const Shipments = ({ userId, userRole }: { userId: string; userRole: string }) => {
  const [shipments, setShipments] = useState<any[]>([]);
  const [newShipment, setNewShipment] = useState({
    title: '',
    origin_address: '',
    destination_address: '',
    origin_lat: null as number | null,
    origin_lng: null as number | null,
    destination_lat: null as number | null,
    destination_lng: null as number | null
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchShipments();
  }, [userId, userRole]);

  const fetchShipments = async () => {
    try {
      let query = supabase.from('shipments').select('*');
      
      if (userRole !== 'administrator') {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast({
        title: "Error",
        description: "Failed to load shipments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewShipment({ ...newShipment, [name]: value });
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!newShipment.origin_lat && !newShipment.origin_lng) {
      setNewShipment({
        ...newShipment,
        origin_lat: lat,
        origin_lng: lng
      });
      setModalMessage('Origin location set! Click again to set destination.');
      setShowModal(true);
    } else if (!newShipment.destination_lat && !newShipment.destination_lng) {
      setNewShipment({
        ...newShipment,
        destination_lat: lat,
        destination_lng: lng
      });
      setModalMessage('Destination location set! You can now create the shipment.');
      setShowModal(true);
    }
  };

  const resetLocations = () => {
    setNewShipment({
      ...newShipment,
      origin_lat: null,
      origin_lng: null,
      destination_lat: null,
      destination_lng: null
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userRole === 'transporter') {
      toast({
        title: "Access Denied",
        description: "Only farmers and administrators can create shipments.",
        variant: "destructive"
      });
      return;
    }

    if (!newShipment.title || !newShipment.origin_address || !newShipment.destination_address) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('shipments')
        .insert([{
          ...newShipment,
          user_id: userId,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shipment created successfully!",
      });

      setNewShipment({
        title: '',
        origin_address: '',
        destination_address: '',
        origin_lat: null,
        origin_lng: null,
        destination_lat: null,
        destination_lng: null
      });

      fetchShipments();
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast({
        title: "Error",
        description: "Failed to create shipment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getMapMarkers = () => {
    const markers = [];
    
    if (newShipment.origin_lat && newShipment.origin_lng) {
      markers.push({
        lat: newShipment.origin_lat,
        lng: newShipment.origin_lng,
        title: "Origin",
        info: "Pickup location"
      });
    }
    
    if (newShipment.destination_lat && newShipment.destination_lng) {
      markers.push({
        lat: newShipment.destination_lat,
        lng: newShipment.destination_lng,
        title: "Destination",
        info: "Drop-off location"
      });
    }

    return markers;
  };

  const getMapRoutes = () => {
    if (newShipment.origin_lat && newShipment.origin_lng && 
        newShipment.destination_lat && newShipment.destination_lng) {
      return [{
        origin: { lat: newShipment.origin_lat, lng: newShipment.origin_lng },
        destination: { lat: newShipment.destination_lat, lng: newShipment.destination_lng },
        title: "Delivery Route",
        color: "#3b82f6"
      }];
    }
    return [];
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-3xl font-bold text-foreground mb-8">
        {userRole === 'administrator' ? 'All Shipments' : 'Your Shipments'}
      </h1>
      
      {showModal && (
        <MessageModal
          message={modalMessage}
          onClose={() => setShowModal(false)}
        />
      )}

      {(userRole === 'farmer' || userRole === 'administrator') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg shadow-card border">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Create New Shipment</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Shipment Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={newShipment.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Oil Seed Batch #001"
                  required
                />
              </div>

              <div>
                <Label htmlFor="origin_address">Origin Address</Label>
                <Input
                  id="origin_address"
                  name="origin_address"
                  value={newShipment.origin_address}
                  onChange={handleInputChange}
                  placeholder="Farm address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="destination_address">Destination Address</Label>
                <Input
                  id="destination_address"
                  name="destination_address"
                  value={newShipment.destination_address}
                  onChange={handleInputChange}
                  placeholder="Delivery address"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetLocations}
                  className="flex-1"
                >
                  Reset Locations
                </Button>
                <Button type="submit" className="flex-1">
                  Create Shipment
                </Button>
              </div>
            </form>

            <div className="mt-4 text-sm text-muted-foreground">
              <p>Current selections:</p>
              <p>Origin: {newShipment.origin_lat && newShipment.origin_lng ? `${newShipment.origin_lat.toFixed(4)}, ${newShipment.origin_lng.toFixed(4)}` : 'Not set'}</p>
              <p>Destination: {newShipment.destination_lat && newShipment.destination_lng ? `${newShipment.destination_lat.toFixed(4)}, ${newShipment.destination_lng.toFixed(4)}` : 'Not set'}</p>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-card border">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Select Locations</h2>
            <p className="text-muted-foreground mb-4">
              Click on the map to set origin and destination locations for your shipment.
            </p>
            
            <GoogleMap
              height="400px"
              markers={getMapMarkers()}
              routes={getMapRoutes()}
              onMapClick={handleMapClick}
              center={{ lat: 20.5937, lng: 78.9629 }}
              zoom={5}
            />
          </div>
        </div>
      )}

      <div className="bg-card p-6 rounded-lg shadow-card border">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">
          {userRole === 'administrator' ? 'All Shipments' : 'Your Shipments'}
        </h2>
        
        {shipments.length === 0 ? (
          <p className="text-muted-foreground">No shipments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground">Title</th>
                  <th className="text-left p-2 text-muted-foreground">Origin</th>
                  <th className="text-left p-2 text-muted-foreground">Destination</th>
                  <th className="text-left p-2 text-muted-foreground">Status</th>
                  <th className="text-left p-2 text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-2 font-medium text-foreground">{shipment.title}</td>
                    <td className="p-2 text-muted-foreground">{shipment.origin_address || 'N/A'}</td>
                    <td className="p-2 text-muted-foreground">{shipment.destination_address || 'N/A'}</td>
                    <td className="p-2">
                      <Badge 
                        variant={shipment.status === 'completed' ? 'default' : 
                                shipment.status === 'in-transit' ? 'secondary' : 'outline'}
                      >
                        {shipment.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {new Date(shipment.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const Inventory = ({ userId }: { userId: string }) => {
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ type: '', quantity: '', location: '' });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // For now, we'll use placeholder data since we haven't created tables yet
    setInventoryItems([]);
    setLoading(false);
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.type || !newItem.quantity || !newItem.location) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    // Placeholder for future database implementation
    toast({
      title: "Info",
      description: "Database tables will be created when you're ready to store data.",
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-3xl font-bold text-foreground mb-8">Inventory Management</h1>
      
      {/* Add New Item Form */}
      <div className="bg-card p-6 rounded-lg shadow-card border mb-6">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Add Inventory Item</h2>
        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="type">Item Type</Label>
            <Input
              id="type"
              name="type"
              value={newItem.type}
              onChange={handleInputChange}
              placeholder="e.g., Sunflower Seeds"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              value={newItem.quantity}
              onChange={handleInputChange}
              placeholder="e.g., 100 kg"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="location">Storage Location</Label>
            <Input
              id="location"
              name="location"
              value={newItem.location}
              onChange={handleInputChange}
              placeholder="e.g., Warehouse A"
              required
            />
          </div>
          
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Add Item
            </Button>
          </div>
        </form>
      </div>

      {/* Current Inventory Table */}
      <div className="bg-card p-6 rounded-lg shadow-card border">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Current Inventory</h2>
        <p className="text-muted-foreground">No inventory items recorded yet. Create database tables to start tracking inventory.</p>
      </div>
    </div>
  );
};

const App = () => {
  const { user, signOut } = useAuth();
  const { userRole, loading: roleLoading, assignRole } = useUserRole(user);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      window.location.href = '/auth';
    }
  }, [user]);

  if (!user) {
    return null;
  }

  // Show role selection if user doesn't have a role yet
  if (!roleLoading && !userRole) {
    return (
      <RoleSelection
        onRoleSelect={async (role) => {
          const result = await assignRole(role);
          if (result.error) {
            console.error('Failed to assign role:', result.error);
          }
        }}
        loading={roleLoading}
      />
    );
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/auth';
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'administrator':
        return Shield;
      case 'farmer':
        return Wheat;
      case 'transporter':
        return Truck;
      default:
        return Package;
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'administrator':
        return 'bg-red-100 text-red-800';
      case 'farmer':
        return 'bg-green-100 text-green-800';
      case 'transporter':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    ];

    if (userRole === 'farmer' || userRole === 'administrator') {
      baseItems.push({ id: 'shipments', name: 'Shipments', icon: Package });
    }

    if (userRole === 'administrator') {
      baseItems.push({ id: 'inventory', name: 'Inventory', icon: Package2 });
    }

    baseItems.push({ id: 'reports', name: 'Reports', icon: BarChart3 });

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-border`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-border lg:hidden">
          <span className="text-lg font-semibold text-foreground">Menu</span>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Seed Track Flow</h2>
          <p className="text-sm text-muted-foreground">Supply Chain Management</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge className={`text-xs ${getRoleColor()}`}>
              {userRole && (
                <>
                  {(() => {
                    const Icon = getRoleIcon();
                    return <Icon className="h-3 w-3 mr-1" />;
                  })()}
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </>
              )}
            </Badge>
          </div>
        </div>

        <nav className="mt-4 px-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setCurrentPage(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <span className="font-semibold text-foreground">Seed Track Flow</span>
          <div></div>
        </header>

        <main className="flex-1 min-h-screen">
          {currentPage === 'dashboard' && <Dashboard userId={user.id} userRole={userRole!} />}
          {currentPage === 'shipments' && (userRole === 'farmer' || userRole === 'administrator') && (
            <Shipments userId={user.id} userRole={userRole} />
          )}
          {currentPage === 'inventory' && userRole === 'administrator' && (
            <Inventory userId={user.id} />
          )}
          {currentPage === 'reports' && (
            <EnhancedReports userId={user.id} userRole={userRole!} />
          )}
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default App;
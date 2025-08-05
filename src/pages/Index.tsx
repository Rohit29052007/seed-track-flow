import React, { useState, useEffect } from 'react';
import { Truck, LogOut, Home, Menu, X, Package, BarChart, PlusCircle, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// --- Components ---

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const MessageModal = ({ message, onClose }: { message: string; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-elegant p-6 max-w-sm w-full text-center border">
        <p className="text-lg font-semibold mb-4 text-card-foreground">{message}</p>
        <Button onClick={onClose} size="sm">
          OK
        </Button>
      </div>
    </div>
  );
};

const Dashboard = ({ userId }: { userId: string }) => {
  const [shipmentsCount, setShipmentsCount] = useState(0);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // For now, we'll use placeholder data since we haven't created tables yet
        setShipmentsCount(0);
        setInventoryCount(0);
        setLoading(false);
      } catch (e) {
        console.error("Error fetching dashboard data:", e);
        setError("Failed to load dashboard data.");
        setLoading(false);
      }
    };

    if (userId) {
      fetchCounts();
    }
  }, [userId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-destructive p-4 text-center">{error}</div>;

  return (
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-3xl font-bold text-foreground mb-8 rounded-md p-4 bg-card shadow-card border">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg shadow-card border flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Shipments</p>
            <p className="text-3xl font-semibold text-card-foreground">{shipmentsCount}</p>
          </div>
          <Truck className="text-primary w-10 h-10" />
        </div>
        <div className="bg-card p-6 rounded-lg shadow-card border flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Inventory Items</p>
            <p className="text-3xl font-semibold text-card-foreground">{inventoryCount}</p>
          </div>
          <Package className="text-success w-10 h-10" />
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-card border">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Quick Overview</h2>
        <p className="text-muted-foreground">
          Welcome to your Oil Seed Supply Chain Tracker dashboard! Here you can get a quick glance at your key metrics.
          Use the sidebar to navigate to Shipments, Inventory, or Reports.
        </p>
      </div>
    </div>
  );
};

const Shipments = ({ userId }: { userId: string }) => {
  const [shipments, setShipments] = useState<any[]>([]);
  const [newShipment, setNewShipment] = useState({ origin: '', destination: '', eta: '', status: 'Pending', type: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // For now, we'll use placeholder data since we haven't created tables yet
    setShipments([]);
    setLoading(false);
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewShipment({ ...newShipment, [name]: value });
  };

  const handleAddShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShipment.origin || !newShipment.destination || !newShipment.eta || !newShipment.type) {
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

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-destructive p-4 text-center">{error}</div>;

  return (
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-3xl font-bold text-foreground mb-8 rounded-md p-4 bg-card shadow-card border">Shipment Management</h1>

      {/* Add New Shipment Form */}
      <div className="bg-card p-6 rounded-lg shadow-card border mb-8">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Add New Shipment</h2>
        <form onSubmit={handleAddShipment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="origin" className="block text-sm font-medium text-card-foreground mb-1">Origin</label>
            <input
              type="text"
              id="origin"
              name="origin"
              value={newShipment.origin}
              onChange={handleInputChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Farm A"
              required
            />
          </div>
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-card-foreground mb-1">Destination</label>
            <input
              type="text"
              id="destination"
              name="destination"
              value={newShipment.destination}
              onChange={handleInputChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Processing Plant B"
              required
            />
          </div>
          <div>
            <label htmlFor="eta" className="block text-sm font-medium text-card-foreground mb-1">ETA</label>
            <input
              type="text"
              id="eta"
              name="eta"
              value={newShipment.eta}
              onChange={handleInputChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="YYYY-MM-DD HH:MM"
              required
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-card-foreground mb-1">Oil Seed Type</label>
            <input
              type="text"
              id="type"
              name="type"
              value={newShipment.type}
              onChange={handleInputChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Soybean, Sunflower, etc."
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" className="shadow-card">
              <PlusCircle className="w-4 h-4" />
              Add Shipment
            </Button>
          </div>
        </form>
      </div>

      {/* Current Shipments Table */}
      <div className="bg-card p-6 rounded-lg shadow-card border">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Current Shipments</h2>
        <p className="text-muted-foreground">No shipments recorded yet. Create database tables to start tracking shipments.</p>
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-3xl font-bold text-foreground mb-8 rounded-md p-4 bg-card shadow-card border">Inventory Management</h1>

      {/* Add New Item Form */}
      <div className="bg-card p-6 rounded-lg shadow-card border mb-8">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Add New Inventory Item</h2>
        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-card-foreground mb-1">Oil Seed Type</label>
            <input
              type="text"
              id="type"
              name="type"
              value={newItem.type}
              onChange={handleInputChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Soybean, Sunflower, etc."
              required
            />
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-card-foreground mb-1">Quantity (kg)</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={newItem.quantity}
              onChange={handleInputChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="1000"
              required
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-card-foreground mb-1">Storage Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={newItem.location}
              onChange={handleInputChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Warehouse A"
              required
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button type="submit" className="shadow-card">
              <PlusCircle className="w-4 h-4" />
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

const Reports = () => {
  return (
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-3xl font-bold text-foreground mb-8 rounded-md p-4 bg-card shadow-card border">Reports</h1>
      <div className="bg-card p-6 rounded-lg shadow-card border">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Reports and analytics will be available once you start tracking shipments and inventory data.
        </p>
      </div>
    </div>
  );
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth';
    }
  }, [user, loading]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderPage = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    if (!user) {
      return null; // Will redirect to auth
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard userId={user.id} />;
      case 'shipments':
        return <Shipments userId={user.id} />;
      case 'inventory':
        return <Inventory userId={user.id} />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard userId={user.id} />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-sidebar text-sidebar-foreground w-64 p-6 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-40 shadow-elegant border-r border-sidebar-border`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Oil Seed Tracker</h2>
          <button onClick={toggleSidebar} className="md:hidden text-sidebar-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav>
          <ul>
            <li className="mb-4">
              <Button
                onClick={() => { setCurrentPage('dashboard'); setIsSidebarOpen(false); }}
                variant="sidebar"
                className={`w-full justify-start ${currentPage === 'dashboard' ? 'bg-sidebar-primary text-sidebar-primary-foreground' : ''}`}
              >
                <Home className="w-5 h-5" />
                Dashboard
              </Button>
            </li>
            <li className="mb-4">
              <Button
                onClick={() => { setCurrentPage('shipments'); setIsSidebarOpen(false); }}
                variant="sidebar"
                className={`w-full justify-start ${currentPage === 'shipments' ? 'bg-sidebar-primary text-sidebar-primary-foreground' : ''}`}
              >
                <Truck className="w-5 h-5" />
                Shipments
              </Button>
            </li>
            <li className="mb-4">
              <Button
                onClick={() => { setCurrentPage('inventory'); setIsSidebarOpen(false); }}
                variant="sidebar"
                className={`w-full justify-start ${currentPage === 'inventory' ? 'bg-sidebar-primary text-sidebar-primary-foreground' : ''}`}
              >
                <Package className="w-5 h-5" />
                Inventory
              </Button>
            </li>
            <li className="mb-4">
              <Button
                onClick={() => { setCurrentPage('reports'); setIsSidebarOpen(false); }}
                variant="sidebar"
                className={`w-full justify-start ${currentPage === 'reports' ? 'bg-sidebar-primary text-sidebar-primary-foreground' : ''}`}
              >
                <BarChart className="w-5 h-5" />
                Reports
              </Button>
            </li>
          </ul>
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-sm text-sidebar-foreground/70 mb-2">Logged in as:</p>
          <p className="text-base font-medium truncate text-sidebar-foreground">{user.email}</p>
          <Button
            onClick={signOut}
            variant="sidebar"
            className="mt-4 w-full justify-start bg-sidebar-accent"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4">
        {/* Mobile Header for Toggle */}
        <header className="md:hidden flex items-center justify-between p-4 bg-card shadow-card rounded-md mb-4 border">
          <h1 className="text-xl font-bold text-card-foreground">Oil Seed Tracker</h1>
          <Button onClick={toggleSidebar} variant="ghost" size="icon">
            <Menu className="w-6 h-6" />
          </Button>
        </header>
        {renderPage()}
      </main>
    </div>
  );
};

const Index = () => {
  return <App />;
};

export default Index;
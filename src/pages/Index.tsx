import React, { useState, useEffect } from 'react';
import { Truck, LogIn, LogOut, Home, Menu, X, Package, BarChart, PlusCircle, FileText } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, addDoc, deleteDoc, onSnapshot, collection, query } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Firebase configuration - using mock data for demo
const firebaseConfig = typeof (window as any).__firebase_config !== 'undefined' ? JSON.parse((window as any).__firebase_config) : {
  apiKey: "demo-key",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};
const appId = typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'demo-app-id';

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

const Dashboard = ({ userId, db }: { userId: string; db: any }) => {
    const [shipmentsCount, setShipmentsCount] = useState(0);
    const [inventoryCount, setInventoryCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!db || !userId) {
            setError("Database not initialized or user not authenticated.");
            setLoading(false);
            return;
        }

        let unsubscribeShipments: (() => void) | null = null;
        let unsubscribeInventory: (() => void) | null = null;

        try {
            const qShipments = query(collection(db, `artifacts/${appId}/users/${userId}/shipments`));
            unsubscribeShipments = onSnapshot(qShipments, (snapshot) => {
                setShipmentsCount(snapshot.size);
                setLoading(false);
            }, (err) => {
                console.error("Error fetching shipments for dashboard:", err);
                setError("Failed to load dashboard data.");
                setLoading(false);
            });
        } catch (e) {
            console.error("Error setting up shipment snapshot for dashboard:", e);
            setError("Failed to initialize dashboard data.");
            setLoading(false);
        }

        try {
            const qInventory = query(collection(db, `artifacts/${appId}/users/${userId}/inventory`));
            unsubscribeInventory = onSnapshot(qInventory, (snapshot) => {
                setInventoryCount(snapshot.size);
            }, (err) => {
                console.error("Error fetching inventory for dashboard:", err);
                setError("Failed to load dashboard data.");
            });
        } catch (e) {
            console.error("Error setting up inventory snapshot for dashboard:", e);
            setError("Failed to initialize dashboard data.");
        }

        return () => {
            if (unsubscribeShipments) unsubscribeShipments();
            if (unsubscribeInventory) unsubscribeInventory();
        };
    }, [db, userId]);

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

const Shipments = ({ userId, db }: { userId: string; db: any }) => {
    const [shipments, setShipments] = useState<any[]>([]);
    const [newShipment, setNewShipment] = useState({ origin: '', destination: '', eta: '', status: 'Pending', type: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalMessage, setModalMessage] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!db || !userId) {
            setError("Database not initialized or user not authenticated.");
            setLoading(false);
            return;
        }

        let unsubscribe: (() => void) | null = null;
        try {
            const q = query(collection(db, `artifacts/${appId}/users/${userId}/shipments`));
            unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedShipments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setShipments(fetchedShipments);
                setLoading(false);
            }, (err) => {
                console.error("Error fetching shipments:", err);
                setError("Failed to load shipments.");
                setLoading(false);
            });
        } catch (e) {
            console.error("Error setting up shipment snapshot:", e);
            setError("Failed to initialize shipment tracking.");
            setLoading(false);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [db, userId]);

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
        try {
            await addDoc(collection(db, `artifacts/${appId}/users/${userId}/shipments`), {
                ...newShipment,
                createdAt: new Date().toISOString(),
            });
            setNewShipment({ origin: '', destination: '', eta: '', status: 'Pending', type: '' });
            toast({
                title: "Success",
                description: "Shipment added successfully!"
            });
        } catch (e) {
            console.error("Error adding document: ", e);
            toast({
                title: "Error",
                description: "Error adding shipment. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteShipment = async (id: string) => {
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/shipments`, id));
            toast({
                title: "Success",
                description: "Shipment deleted successfully!"
            });
        } catch (e) {
            console.error("Error deleting document: ", e);
            toast({
                title: "Error",
                description: "Error deleting shipment. Please try again.",
                variant: "destructive"
            });
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="text-destructive p-4 text-center">{error}</div>;

    return (
        <div className="p-6 bg-background min-h-screen">
            {modalMessage && <MessageModal message={modalMessage} onClose={() => setModalMessage(null)} />}

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
                {shipments.length === 0 ? (
                    <p className="text-muted-foreground">No shipments recorded yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Origin</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Destination</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ETA</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {shipments.map((shipment) => (
                                    <tr key={shipment.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-card-foreground">{shipment.id.substring(0, 8)}...</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{shipment.origin}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{shipment.destination}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{shipment.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{shipment.eta}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                shipment.status === 'In Transit' ? 'bg-warning-light text-warning-foreground' :
                                                shipment.status === 'Delivered' ? 'bg-success-light text-success-foreground' :
                                                'bg-muted text-muted-foreground'
                                            }`}>
                                                {shipment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button
                                                onClick={() => handleDeleteShipment(shipment.id)}
                                                variant="destructive"
                                                size="sm"
                                            >
                                                Delete
                                            </Button>
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

const Inventory = ({ userId, db }: { userId: string; db: any }) => {
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [newItem, setNewItem] = useState({ type: '', quantity: '', location: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!db || !userId) {
            setError("Database not initialized or user not authenticated.");
            setLoading(false);
            return;
        }

        let unsubscribe: (() => void) | null = null;
        try {
            const q = query(collection(db, `artifacts/${appId}/users/${userId}/inventory`));
            unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setInventoryItems(fetchedItems);
                setLoading(false);
            }, (err) => {
                console.error("Error fetching inventory:", err);
                setError("Failed to load inventory.");
                setLoading(false);
            });
        } catch (e) {
            console.error("Error setting up inventory snapshot:", e);
            setError("Failed to initialize inventory tracking.");
            setLoading(false);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [db, userId]);

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
        try {
            await addDoc(collection(db, `artifacts/${appId}/users/${userId}/inventory`), {
                ...newItem,
                quantity: parseFloat(newItem.quantity),
                createdAt: new Date().toISOString(),
            });
            setNewItem({ type: '', quantity: '', location: '' });
            toast({
                title: "Success",
                description: "Inventory item added successfully!"
            });
        } catch (e) {
            console.error("Error adding document: ", e);
            toast({
                title: "Error",
                description: "Error adding inventory item. Please try again.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteItem = async (id: string) => {
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/inventory`, id));
            toast({
                title: "Success",
                description: "Inventory item deleted successfully!"
            });
        } catch (e) {
            console.error("Error deleting document: ", e);
            toast({
                title: "Error",
                description: "Error deleting inventory item. Please try again.",
                variant: "destructive"
            });
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="text-destructive p-4 text-center">{error}</div>;

    return (
        <div className="p-6 bg-background min-h-screen">
            <h1 className="text-3xl font-bold text-foreground mb-8 rounded-md p-4 bg-card shadow-card border">Inventory Management</h1>

            {/* Add New Inventory Item Form */}
            <div className="bg-card p-6 rounded-lg shadow-card border mb-8">
                <h2 className="text-xl font-semibold text-card-foreground mb-4">Add New Inventory Item</h2>
                <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-card-foreground mb-1">Oil Seed Type</label>
                        <input
                            type="text"
                            id="type"
                            name="type"
                            value={newItem.type}
                            onChange={handleInputChange}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            placeholder="Sunflower Seeds"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-card-foreground mb-1">Quantity (kg/tons)</label>
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
                        <label htmlFor="location" className="block text-sm font-medium text-card-foreground mb-1">Location</label>
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
                    <div className="md:col-span-2 flex justify-end">
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
                {inventoryItems.length === 0 ? (
                    <p className="text-muted-foreground">No inventory items recorded yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {inventoryItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-card-foreground">{item.id.substring(0, 8)}...</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.location}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button
                                                onClick={() => handleDeleteItem(item.id)}
                                                variant="destructive"
                                                size="sm"
                                            >
                                                Delete
                                            </Button>
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

const Reports = () => {
    const { toast } = useToast();

    const handleGenerateReport = () => {
        toast({
            title: "Report Generation",
            description: "Generating a comprehensive report... (This feature is under development)"
        });
    };

    return (
        <div className="p-6 bg-background min-h-screen">
            <h1 className="text-3xl font-bold text-foreground mb-8 rounded-md p-4 bg-card shadow-card border">Reports & Analytics</h1>

            <div className="bg-card p-6 rounded-lg shadow-card border text-center">
                <FileText className="w-16 h-16 text-primary mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-card-foreground mb-4">Advanced Reporting Coming Soon!</h2>
                <p className="text-muted-foreground mb-6">
                    This section will provide comprehensive analytics and customizable reports on your oil seed supply chain,
                    including historical data, performance metrics, and compliance insights.
                </p>
                <Button onClick={handleGenerateReport} size="lg" className="shadow-card">
                    <PlusCircle className="w-4 h-4" />
                    Generate Dummy Report
                </Button>
            </div>
        </div>
    );
};

const Login = ({ onLogin, auth, setUserId }: { onLogin: () => void; auth: any; setUserId: (id: string) => void }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleAnonymousLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!auth) {
                throw new Error("Firebase Auth is not initialized.");
            }
            if (typeof (window as any).__initial_auth_token !== 'undefined' && (window as any).__initial_auth_token) {
                await signInWithCustomToken(auth, (window as any).__initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
            setLoading(false);
            toast({
                title: "Success",
                description: "Login successful!"
            });
            onLogin();
        } catch (e) {
            console.error("Login failed:", e);
            setError("Failed to log in. Please try again.");
            setLoading(false);
            toast({
                title: "Error",
                description: "Failed to log in. Please try again.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="bg-card p-8 rounded-lg shadow-elegant w-full max-w-md text-center border">
                <h2 className="text-2xl font-bold text-card-foreground mb-6">Welcome to Oil Seed Tracker</h2>
                <p className="text-muted-foreground mb-8">
                    Please log in to access the real-time supply chain tracking dashboard.
                </p>
                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <Button
                        onClick={handleAnonymousLogin}
                        size="lg"
                        className="w-full shadow-card"
                    >
                        <LogIn className="w-4 h-4" />
                        Login Anonymously
                    </Button>
                )}
                {error && <p className="text-destructive mt-4">{error}</p>}
                <p className="text-sm text-muted-foreground mt-6">
                    This is a demo application. Anonymous login is provided for easy access.
                </p>
            </div>
        </div>
    );
};

const App = () => {
    const [currentPage, setCurrentPage] = useState('login');
    const [user, setUser] = useState<any>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [firestoreDb, setFirestoreDb] = useState<any>(null);
    const [firebaseAuth, setFirebaseAuth] = useState<any>(null);

    useEffect(() => {
        let appInstance: any;
        let authInstance: any;
        let dbInstance: any;

        try {
            appInstance = initializeApp(firebaseConfig);
            authInstance = getAuth(appInstance);
            dbInstance = getFirestore(appInstance);

            setFirebaseAuth(authInstance);
            setFirestoreDb(dbInstance);

            const unsubscribeAuth = onAuthStateChanged(authInstance, async (currentUser) => {
                setUser(currentUser);
                if (currentUser) {
                    setUserId(currentUser.uid);
                    setCurrentPage('dashboard');
                } else {
                    setUserId(null);
                    setCurrentPage('login');
                }
                setIsAuthReady(true);
            });

            return () => unsubscribeAuth();
        } catch (e) {
            console.error("Firebase initialization failed:", e);
            setIsAuthReady(true);
        }
    }, []);

    const handleLoginSuccess = () => {
        // The onAuthStateChanged listener will handle setting the user and redirecting.
    };

    const handleLogout = async () => {
        try {
            if (firebaseAuth) {
                await signOut(firebaseAuth);
            }
            setCurrentPage('login');
        } catch (e) {
            console.error("Error logging out:", e);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const renderPage = () => {
        if (!isAuthReady) {
            return <LoadingSpinner />;
        }

        if (!user) {
            if (!firestoreDb || !firebaseAuth) {
                return <div className="text-destructive p-4 text-center">Firebase services not available for login. Please refresh.</div>;
            }
            return <Login onLogin={handleLoginSuccess} auth={firebaseAuth} setUserId={setUserId} />;
        }

        if (!firestoreDb || !firebaseAuth) {
            return <div className="text-destructive p-4 text-center">Firebase services not available. Please refresh.</div>;
        }

        switch (currentPage) {
            case 'dashboard':
                return <Dashboard userId={userId!} db={firestoreDb} />;
            case 'shipments':
                return <Shipments userId={userId!} db={firestoreDb} />;
            case 'inventory':
                return <Inventory userId={userId!} db={firestoreDb} />;
            case 'reports':
                return <Reports />;
            default:
                return <Dashboard userId={userId!} db={firestoreDb} />;
        }
    };

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
                {user && userId && (
                    <div className="absolute bottom-6 left-6 right-6">
                        <p className="text-sm text-sidebar-foreground/70 mb-2">Logged in as:</p>
                        <p className="text-base font-medium truncate text-sidebar-foreground">{userId}</p>
                        <Button
                            onClick={handleLogout}
                            variant="sidebar"
                            className="mt-4 w-full justify-start bg-sidebar-accent"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </Button>
                    </div>
                )}
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
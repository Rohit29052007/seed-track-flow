import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/hooks/useUserRole';
import { Truck, Wheat, Shield } from 'lucide-react';

interface RoleSelectionProps {
  onRoleSelect: (role: UserRole) => Promise<void>;
  loading: boolean;
}

export const RoleSelection = ({ onRoleSelect, loading }: RoleSelectionProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const roles = [
    {
      role: 'farmer' as UserRole,
      icon: Wheat,
      title: 'Farmer',
      description: 'Create and manage oil seed shipments, track deliveries from your farm',
      permissions: ['Create shipments', 'View own shipments', 'Track deliveries']
    },
    {
      role: 'transporter' as UserRole,
      icon: Truck,
      title: 'Transporter',
      description: 'Handle transportation of oil seeds, update delivery status and locations',
      permissions: ['View assigned shipments', 'Update delivery status', 'Track routes']
    },
    {
      role: 'administrator' as UserRole,
      icon: Shield,
      title: 'Administrator',
      description: 'Full system access, manage all users and shipments, view comprehensive reports',
      permissions: ['Full system access', 'Manage users', 'View all reports', 'System administration']
    }
  ];

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    await onRoleSelect(role);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Choose Your Role</h1>
          <p className="text-muted-foreground">
            Select your role in the oil seed supply chain to access relevant features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map(({ role, icon: Icon, title, description, permissions }) => (
            <Card 
              key={role} 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-primary/50"
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="text-sm">
                  {description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {permissions.map((permission) => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => handleRoleSelect(role)}
                  className="w-full"
                  disabled={loading && selectedRole === role}
                  variant={selectedRole === role ? "default" : "outline"}
                >
                  {loading && selectedRole === role ? "Assigning..." : `Select ${title}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
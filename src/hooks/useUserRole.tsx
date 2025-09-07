import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type UserRole = 'administrator' | 'farmer' | 'transporter';

export const useUserRole = (user: User | null) => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setUserRole(data?.role || null);
        setError(null);
      } catch (err) {
        console.error('Error fetching user role:', err);
        setError('Failed to fetch user role');
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const assignRole = async (role: UserRole) => {
    if (!user) return { error: 'No authenticated user' };

    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: user.id, 
          role 
        }, { 
          onConflict: 'user_id' 
        });

      if (error) throw error;

      setUserRole(role);
      return { error: null };
    } catch (err) {
      console.error('Error assigning role:', err);
      return { error: 'Failed to assign role' };
    }
  };

  const hasRole = (role: UserRole) => userRole === role;
  const isAdmin = () => hasRole('administrator');
  const isFarmer = () => hasRole('farmer');
  const isTransporter = () => hasRole('transporter');

  return {
    userRole,
    loading,
    error,
    assignRole,
    hasRole,
    isAdmin,
    isFarmer,
    isTransporter
  };
};
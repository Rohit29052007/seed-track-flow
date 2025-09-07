-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('administrator', 'farmer', 'transporter');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Administrators can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Administrators can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Administrators can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Administrators can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'administrator'));

-- Add updated_at trigger
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update shipments table RLS policies for role-based access
DROP POLICY IF EXISTS "Users can view their own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can create their own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can update their own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can delete their own shipments" ON public.shipments;

-- New role-based policies for shipments
CREATE POLICY "Farmers and transporters can view their own shipments"
ON public.shipments
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'administrator')
);

CREATE POLICY "Farmers can create shipments"
ON public.shipments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND 
  (public.has_role(auth.uid(), 'farmer') OR public.has_role(auth.uid(), 'administrator'))
);

CREATE POLICY "Farmers and administrators can update shipments"
ON public.shipments
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id AND public.has_role(auth.uid(), 'farmer')) OR 
  public.has_role(auth.uid(), 'administrator')
);

CREATE POLICY "Administrators can delete shipments"
ON public.shipments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'administrator'));
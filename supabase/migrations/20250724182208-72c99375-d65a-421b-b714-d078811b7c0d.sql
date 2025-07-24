-- Enable RLS on remaining tables
ALTER TABLE public.horasponto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

-- Fix policies for horasponto and records tables
DROP POLICY IF EXISTS "horasponto_select_all" ON public.horasponto;
DROP POLICY IF EXISTS "horasponto_insert_all" ON public.horasponto;
DROP POLICY IF EXISTS "horasponto_update_all" ON public.horasponto;
DROP POLICY IF EXISTS "horasponto_delete_all" ON public.horasponto;

-- Create proper RLS policies for horasponto (user can only access their own data)
CREATE POLICY "Users can view their own horasponto" 
ON public.horasponto 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own horasponto" 
ON public.horasponto 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own horasponto" 
ON public.horasponto 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own horasponto" 
ON public.horasponto 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix policies for records table
DROP POLICY IF EXISTS "records_select_all" ON public.records;
DROP POLICY IF EXISTS "records_insert_all" ON public.records;
DROP POLICY IF EXISTS "records_update_all" ON public.records;
DROP POLICY IF EXISTS "records_delete_all" ON public.records;

-- Create proper RLS policies for records (user can only access their own data)
CREATE POLICY "Users can view their own records" 
ON public.records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own records" 
ON public.records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records" 
ON public.records 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own records" 
ON public.records 
FOR DELETE 
USING (auth.uid() = user_id);
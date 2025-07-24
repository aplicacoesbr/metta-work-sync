-- Fix RLS policies for time_points table
DROP POLICY IF EXISTS "time_points_select_all" ON public.time_points;
DROP POLICY IF EXISTS "time_points_insert_all" ON public.time_points;
DROP POLICY IF EXISTS "time_points_update_all" ON public.time_points;
DROP POLICY IF EXISTS "time_points_delete_all" ON public.time_points;

-- Create proper RLS policies for time_points (user can only access their own data)
CREATE POLICY "Users can view their own time points" 
ON public.time_points 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own time points" 
ON public.time_points 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time points" 
ON public.time_points 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time points" 
ON public.time_points 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix RLS policies for time_records table
DROP POLICY IF EXISTS "time_records_select_all" ON public.time_records;
DROP POLICY IF EXISTS "time_records_insert_all" ON public.time_records;
DROP POLICY IF EXISTS "time_records_update_all" ON public.time_records;
DROP POLICY IF EXISTS "time_records_delete_all" ON public.time_records;

-- Create proper RLS policies for time_records (user can only access their own data)
CREATE POLICY "Users can view their own time records" 
ON public.time_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own time records" 
ON public.time_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time records" 
ON public.time_records 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time records" 
ON public.time_records 
FOR DELETE 
USING (auth.uid() = user_id);
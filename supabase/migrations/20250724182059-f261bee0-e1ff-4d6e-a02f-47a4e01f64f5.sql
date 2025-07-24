-- Enable RLS on all tables that need it
ALTER TABLE public.time_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Check if this is aplicacao@mettabr.com
  IF NEW.email = 'aplicacao@mettabr.com' THEN
    -- Update the role to administrador
    UPDATE public.profiles 
    SET role = 'administrador' 
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_bruno_admin_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Check if this is bruno.porto@mettabr.com
  IF NEW.email = 'bruno.porto@mettabr.com' THEN
    -- Update the role to administrator
    UPDATE public.profiles 
    SET role = 'administrador' 
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add profile_complete flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_complete boolean DEFAULT false;

-- Mark existing profiles that have CPF or CNPJ filled as complete
UPDATE public.profiles 
SET profile_complete = true 
WHERE (cpf IS NOT NULL AND cpf != '') OR (cnpj IS NOT NULL AND cnpj != '');

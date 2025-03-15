-- Atualiza a tabela profiles para incluir campos adicionais

-- Adicionar colunas extras se não existirem
DO $$
BEGIN
    -- Verificar e adicionar coluna phone
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' 
                   AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;

    -- Verificar e adicionar coluna bio
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' 
                   AND column_name = 'bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    END IF;

    -- Verificar e adicionar coluna language
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' 
                   AND column_name = 'language') THEN
        ALTER TABLE public.profiles ADD COLUMN language TEXT DEFAULT 'pt-BR';
    END IF;

    -- Verificar e adicionar coluna theme
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' 
                   AND column_name = 'theme') THEN
        ALTER TABLE public.profiles ADD COLUMN theme TEXT DEFAULT 'system';
    END IF;

    -- Verificar e adicionar coluna address se você quiser expandir no futuro
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' 
                   AND column_name = 'address') THEN
        ALTER TABLE public.profiles ADD COLUMN address JSONB;
    END IF;

    -- Adicionar ou atualizar coluna website
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' 
                   AND column_name = 'website') THEN
        ALTER TABLE public.profiles ADD COLUMN website TEXT;
    END IF;

    -- Garantir que a coluna email seja opcional
    ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
END $$; 
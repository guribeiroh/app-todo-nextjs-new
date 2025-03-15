-- Criar extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Trigger para criar perfil automaticamente após registro
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_profile_after_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.create_profile_for_user();

-- Tabela de listas de tarefas
CREATE TABLE public.task_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL
);

-- Criar lista padrão para novos usuários
CREATE OR REPLACE FUNCTION public.create_default_list_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.task_lists (id, name, color, user_id)
  VALUES ('default', 'Tarefas', '#6366F1', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_default_list_after_profile
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.create_default_list_for_user();

-- Tabela de tarefas
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT NOT NULL DEFAULT 'média',
  due_date TIMESTAMP WITH TIME ZONE,
  list_id UUID REFERENCES public.task_lists NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  position INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES auth.users NOT NULL
);

-- Tabela de subtarefas
CREATE TABLE public.subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Configurar políticas de segurança RLS (Row Level Security)

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- Políticas para perfis
CREATE POLICY "Usuários podem ver apenas seu próprio perfil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar apenas seu próprio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Políticas para listas
CREATE POLICY "Usuários podem ver apenas suas próprias listas" 
ON public.task_lists FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas suas próprias listas" 
ON public.task_lists FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas suas próprias listas" 
ON public.task_lists FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir apenas suas próprias listas" 
ON public.task_lists FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para tarefas
CREATE POLICY "Usuários podem ver apenas suas próprias tarefas" 
ON public.tasks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas suas próprias tarefas" 
ON public.tasks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas suas próprias tarefas" 
ON public.tasks FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir apenas suas próprias tarefas" 
ON public.tasks FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para subtarefas (baseadas na propriedade da tarefa pai)
CREATE POLICY "Usuários podem ver subtarefas de suas próprias tarefas" 
ON public.subtasks FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tasks 
  WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()
));

CREATE POLICY "Usuários podem inserir subtarefas em suas próprias tarefas" 
ON public.subtasks FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tasks 
  WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar subtarefas de suas próprias tarefas" 
ON public.subtasks FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.tasks 
  WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()
));

CREATE POLICY "Usuários podem excluir subtarefas de suas próprias tarefas" 
ON public.subtasks FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.tasks 
  WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()
)); 
<<<<<<< HEAD
-- Tabelas para o sistema Scrum

-- Tabela de Sprints
CREATE TABLE IF NOT EXISTS public.sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  goal TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'review', 'completed')),
  project_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users NOT NULL
);

-- Tabela de Histórias de Usuário
CREATE TABLE IF NOT EXISTS public.user_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('must', 'should', 'could', 'wont')),
  status TEXT NOT NULL CHECK (status IN ('backlog', 'selected', 'inProgress', 'testing', 'done')),
  story_points INTEGER,
  acceptance_criteria TEXT[] DEFAULT '{}',
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  epic VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  position INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES auth.users NOT NULL
);

-- Tabela de relação entre Tarefas e Histórias de Usuário
CREATE TABLE IF NOT EXISTS public.user_story_tasks (
  user_story_id UUID REFERENCES public.user_stories(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (user_story_id, task_id)
);

-- Tabela de Quadros Scrum
CREATE TABLE IF NOT EXISTS public.scrum_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  columns JSONB NOT NULL DEFAULT '{"productBacklog": [], "sprintBacklog": [], "inProgress": [], "testing": [], "done": []}',
  current_sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  project_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users NOT NULL
);

-- Tabela de métricas do Scrum
CREATE TABLE IF NOT EXISTS public.scrum_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE CASCADE NOT NULL,
  burndown_data JSONB DEFAULT '[]',
  velocity FLOAT,
  completed_stories INTEGER DEFAULT 0,
  total_stories INTEGER DEFAULT 0,
  completed_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users NOT NULL
);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_story_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrum_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrum_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para Sprints
CREATE POLICY "Usuários podem ver apenas seus próprios sprints" 
ON public.sprints FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas seus próprios sprints" 
ON public.sprints FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas seus próprios sprints" 
ON public.sprints FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir apenas seus próprios sprints" 
ON public.sprints FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para Histórias de Usuário
CREATE POLICY "Usuários podem ver apenas suas próprias histórias" 
ON public.user_stories FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas suas próprias histórias" 
ON public.user_stories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas suas próprias histórias" 
ON public.user_stories FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir apenas suas próprias histórias" 
ON public.user_stories FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para relação Histórias-Tarefas (baseadas na propriedade da história)
CREATE POLICY "Usuários podem ver relações de suas próprias histórias" 
ON public.user_story_tasks FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_stories 
  WHERE user_stories.id = user_story_tasks.user_story_id 
  AND user_stories.user_id = auth.uid()
));

CREATE POLICY "Usuários podem inserir relações em suas próprias histórias" 
ON public.user_story_tasks FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_stories 
  WHERE user_stories.id = user_story_tasks.user_story_id 
  AND user_stories.user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar relações de suas próprias histórias" 
ON public.user_story_tasks FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.user_stories 
  WHERE user_stories.id = user_story_tasks.user_story_id 
  AND user_stories.user_id = auth.uid()
));

CREATE POLICY "Usuários podem excluir relações de suas próprias histórias" 
ON public.user_story_tasks FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.user_stories 
  WHERE user_stories.id = user_story_tasks.user_story_id 
  AND user_stories.user_id = auth.uid()
));

-- Políticas para Quadros Scrum
CREATE POLICY "Usuários podem ver apenas seus próprios quadros" 
ON public.scrum_boards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas seus próprios quadros" 
ON public.scrum_boards FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas seus próprios quadros" 
ON public.scrum_boards FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir apenas seus próprios quadros" 
ON public.scrum_boards FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para Métricas Scrum
CREATE POLICY "Usuários podem ver apenas suas próprias métricas" 
ON public.scrum_metrics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas suas próprias métricas" 
ON public.scrum_metrics FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas suas próprias métricas" 
ON public.scrum_metrics FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir apenas suas próprias métricas" 
ON public.scrum_metrics FOR DELETE 
USING (auth.uid() = user_id);

-- Criar funções para atualização automática de timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualização automática de timestamps
CREATE TRIGGER set_timestamp_sprints
BEFORE UPDATE ON public.sprints
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_timestamp_user_stories
BEFORE UPDATE ON public.user_stories
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_timestamp_scrum_boards
BEFORE UPDATE ON public.scrum_boards
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_timestamp_scrum_metrics
BEFORE UPDATE ON public.scrum_metrics
FOR EACH ROW
=======
-- Tabelas para o sistema Scrum

-- Tabela de Sprints
CREATE TABLE IF NOT EXISTS public.sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  goal TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'review', 'completed')),
  project_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users NOT NULL
);

-- Tabela de Histórias de Usuário
CREATE TABLE IF NOT EXISTS public.user_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('must', 'should', 'could', 'wont')),
  status TEXT NOT NULL CHECK (status IN ('backlog', 'selected', 'inProgress', 'testing', 'done')),
  story_points INTEGER,
  acceptance_criteria TEXT[] DEFAULT '{}',
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  epic VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  position INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES auth.users NOT NULL
);

-- Tabela de relação entre Tarefas e Histórias de Usuário
CREATE TABLE IF NOT EXISTS public.user_story_tasks (
  user_story_id UUID REFERENCES public.user_stories(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (user_story_id, task_id)
);

-- Tabela de Quadros Scrum
CREATE TABLE IF NOT EXISTS public.scrum_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  columns JSONB NOT NULL DEFAULT '{"productBacklog": [], "sprintBacklog": [], "inProgress": [], "testing": [], "done": []}',
  current_sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  project_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users NOT NULL
);

-- Tabela de métricas do Scrum
CREATE TABLE IF NOT EXISTS public.scrum_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE CASCADE NOT NULL,
  burndown_data JSONB DEFAULT '[]',
  velocity FLOAT,
  completed_stories INTEGER DEFAULT 0,
  total_stories INTEGER DEFAULT 0,
  completed_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users NOT NULL
);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_story_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrum_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrum_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para Sprints
CREATE POLICY "Usuários podem ver apenas seus próprios sprints" 
ON public.sprints FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas seus próprios sprints" 
ON public.sprints FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas seus próprios sprints" 
ON public.sprints FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir apenas seus próprios sprints" 
ON public.sprints FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para Histórias de Usuário
CREATE POLICY "Usuários podem ver apenas suas próprias histórias" 
ON public.user_stories FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas suas próprias histórias" 
ON public.user_stories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas suas próprias histórias" 
ON public.user_stories FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir apenas suas próprias histórias" 
ON public.user_stories FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para relação Histórias-Tarefas (baseadas na propriedade da história)
CREATE POLICY "Usuários podem ver relações de suas próprias histórias" 
ON public.user_story_tasks FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_stories 
  WHERE user_stories.id = user_story_tasks.user_story_id 
  AND user_stories.user_id = auth.uid()
));

CREATE POLICY "Usuários podem inserir relações em suas próprias histórias" 
ON public.user_story_tasks FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_stories 
  WHERE user_stories.id = user_story_tasks.user_story_id 
  AND user_stories.user_id = auth.uid()
));

CREATE POLICY "Usuários podem atualizar relações de suas próprias histórias" 
ON public.user_story_tasks FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.user_stories 
  WHERE user_stories.id = user_story_tasks.user_story_id 
  AND user_stories.user_id = auth.uid()
));

CREATE POLICY "Usuários podem excluir relações de suas próprias histórias" 
ON public.user_story_tasks FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.user_stories 
  WHERE user_stories.id = user_story_tasks.user_story_id 
  AND user_stories.user_id = auth.uid()
));

-- Políticas para Quadros Scrum
CREATE POLICY "Usuários podem ver apenas seus próprios quadros" 
ON public.scrum_boards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas seus próprios quadros" 
ON public.scrum_boards FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas seus próprios quadros" 
ON public.scrum_boards FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir apenas seus próprios quadros" 
ON public.scrum_boards FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para Métricas Scrum
CREATE POLICY "Usuários podem ver apenas suas próprias métricas" 
ON public.scrum_metrics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas suas próprias métricas" 
ON public.scrum_metrics FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas suas próprias métricas" 
ON public.scrum_metrics FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir apenas suas próprias métricas" 
ON public.scrum_metrics FOR DELETE 
USING (auth.uid() = user_id);

-- Criar funções para atualização automática de timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualização automática de timestamps
CREATE TRIGGER set_timestamp_sprints
BEFORE UPDATE ON public.sprints
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_timestamp_user_stories
BEFORE UPDATE ON public.user_stories
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_timestamp_scrum_boards
BEFORE UPDATE ON public.scrum_boards
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_timestamp_scrum_metrics
BEFORE UPDATE ON public.scrum_metrics
FOR EACH ROW
>>>>>>> b193af213fcf7e6f4725f076d7fd52e7d99b25ef
EXECUTE PROCEDURE public.handle_updated_at(); 
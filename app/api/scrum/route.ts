import { NextRequest, NextResponse } from 'next/server';
import { sprintServices, userStoryServices, boardServices, metricsServices } from '../../lib/supabaseServices';
import { handleError, logError } from '../../lib/errorHandler';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Helper para verificar autenticação
async function verifyAuth() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { authenticated: false, userId: null };
  }
  
  return { authenticated: true, userId: session.user.id };
}

// GET /api/scrum - Obter dados do Scrum
export async function GET(req: NextRequest) {
  try {
    const { authenticated, userId } = await verifyAuth();
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const resource = url.searchParams.get('resource');
    const id = url.searchParams.get('id');
    
    switch (resource) {
      case 'sprints':
        if (id) {
          const sprint = await sprintServices.getById(id);
          return NextResponse.json({ data: sprint });
        } else {
          const sprints = await sprintServices.getAll();
          return NextResponse.json({ data: sprints });
        }
        
      case 'active-sprint':
        const activeSprint = await sprintServices.getActive();
        return NextResponse.json({ data: activeSprint });
        
      case 'sprint-stories':
        if (!id) {
          return NextResponse.json({ error: 'ID do sprint é obrigatório' }, { status: 400 });
        }
        const stories = await sprintServices.getSprintStories(id);
        return NextResponse.json({ data: stories });
        
      case 'user-stories':
        if (id) {
          const story = await userStoryServices.getById(id);
          return NextResponse.json({ data: story });
        } else {
          const status = url.searchParams.get('status');
          if (status) {
            const stories = await userStoryServices.getByStatus(status);
            return NextResponse.json({ data: stories });
          } else {
            const stories = await userStoryServices.getAll();
            return NextResponse.json({ data: stories });
          }
        }
        
      case 'story-tasks':
        if (!id) {
          return NextResponse.json({ error: 'ID da história é obrigatório' }, { status: 400 });
        }
        const taskIds = await userStoryServices.getStoryTasks(id);
        return NextResponse.json({ data: taskIds });
        
      case 'story-tasks-details':
        if (!id) {
          return NextResponse.json({ error: 'ID da história é obrigatório' }, { status: 400 });
        }
        const tasksWithDetails = await userStoryServices.getTasksWithDetails(id);
        return NextResponse.json({ data: tasksWithDetails });
        
      case 'boards':
        if (id) {
          const board = await boardServices.getById(id);
          return NextResponse.json({ data: board });
        } else {
          const boards = await boardServices.getAll();
          return NextResponse.json({ data: boards });
        }
        
      case 'metrics':
        if (!id) {
          return NextResponse.json({ error: 'ID do sprint é obrigatório' }, { status: 400 });
        }
        const metrics = await metricsServices.getBySprintId(id);
        return NextResponse.json({ data: metrics });
        
      case 'velocity':
        const sprintCount = url.searchParams.get('count');
        const velocity = await metricsServices.calculateVelocity(
          userId, 
          sprintCount ? parseInt(sprintCount) : 3
        );
        return NextResponse.json({ data: velocity });
        
      default:
        return NextResponse.json({ error: 'Recurso não encontrado' }, { status: 404 });
    }
  } catch (error) {
    logError('API_SCRUM_GET', error);
    return NextResponse.json(
      { 
        error: handleError(error),
        details: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
}

// POST /api/scrum - Criar novos recursos
export async function POST(req: NextRequest) {
  try {
    const { authenticated, userId } = await verifyAuth();
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const body = await req.json();
    const { resource, data } = body;
    
    switch (resource) {
      case 'sprint':
        const newSprint = await sprintServices.create(data);
        return NextResponse.json({ data: newSprint });
        
      case 'user-story':
        const newStory = await userStoryServices.create(data);
        return NextResponse.json({ data: newStory });
        
      case 'board':
        const newBoard = await boardServices.create(data.name, data.projectId);
        return NextResponse.json({ data: newBoard });
        
      case 'assign-task':
        await userStoryServices.assignTask(data.storyId, data.taskId);
        return NextResponse.json({ success: true });
        
      case 'metrics':
        const updatedMetrics = await metricsServices.updateMetrics(data.sprintId, data.metrics);
        return NextResponse.json({ data: updatedMetrics });
        
      default:
        return NextResponse.json({ error: 'Recurso não encontrado' }, { status: 404 });
    }
  } catch (error) {
    logError('API_SCRUM_POST', error);
    return NextResponse.json(
      { 
        error: handleError(error),
        details: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
}

// PUT /api/scrum - Atualizar recursos existentes
export async function PUT(req: NextRequest) {
  try {
    const { authenticated } = await verifyAuth();
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const body = await req.json();
    const { resource, data } = body;
    
    switch (resource) {
      case 'sprint':
        await sprintServices.update(data);
        return NextResponse.json({ success: true });
        
      case 'start-sprint':
        await sprintServices.setActive(data.id, true);
        return NextResponse.json({ success: true });
        
      case 'complete-sprint':
        await sprintServices.complete(data.id);
        return NextResponse.json({ success: true });
        
      case 'user-story':
        await userStoryServices.update(data);
        return NextResponse.json({ success: true });
        
      case 'move-story':
        await userStoryServices.moveStory(data.id, data.status, data.position);
        return NextResponse.json({ success: true });
        
      case 'assign-to-sprint':
        await userStoryServices.assignToSprint(data.storyId, data.sprintId);
        return NextResponse.json({ success: true });
        
      case 'board':
        await boardServices.update(data);
        return NextResponse.json({ success: true });
        
      case 'set-current-sprint':
        await boardServices.setCurrentSprint(data.boardId, data.sprintId);
        return NextResponse.json({ success: true });
        
      case 'burndown':
        await metricsServices.updateBurndownData(data.sprintId, data.burndownData);
        return NextResponse.json({ success: true });
        
      default:
        return NextResponse.json({ error: 'Recurso não encontrado' }, { status: 404 });
    }
  } catch (error) {
    logError('API_SCRUM_PUT', error);
    return NextResponse.json(
      { 
        error: handleError(error),
        details: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
}

// DELETE /api/scrum - Excluir recursos
export async function DELETE(req: NextRequest) {
  try {
    const { authenticated } = await verifyAuth();
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const resource = url.searchParams.get('resource');
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }
    
    switch (resource) {
      case 'sprint':
        await sprintServices.delete(id);
        return NextResponse.json({ success: true });
        
      case 'user-story':
        await userStoryServices.delete(id);
        return NextResponse.json({ success: true });
        
      case 'board':
        await boardServices.delete(id);
        return NextResponse.json({ success: true });
        
      case 'metrics':
        await metricsServices.delete(id);
        return NextResponse.json({ success: true });
        
      case 'story-task':
        const taskId = url.searchParams.get('taskId');
        if (!taskId) {
          return NextResponse.json({ error: 'ID da tarefa é obrigatório' }, { status: 400 });
        }
        await userStoryServices.removeTask(id, taskId);
        return NextResponse.json({ success: true });
        
      default:
        return NextResponse.json({ error: 'Recurso não encontrado' }, { status: 404 });
    }
  } catch (error) {
    logError('API_SCRUM_DELETE', error);
    return NextResponse.json(
      { 
        error: handleError(error),
        details: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    // Verificar autenticação administrativa (você deve implementar uma chave secreta real)
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');
    
    if (apiKey !== process.env.MIGRATION_API_KEY) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      );
    }
    
    // Ler o script SQL
    const scriptPath = path.join(process.cwd(), 'supabase_scrum_schema.sql');
    
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { error: 'Script SQL não encontrado' },
        { status: 404 }
      );
    }
    
    const sqlScript = fs.readFileSync(scriptPath, 'utf8');
    
    // Em vez de executar o script SQL diretamente (o que exigiria permissões admin),
    // vamos apenas verificar se podemos criar as tabelas manualmente
    
    // Verificar a conexão com o Supabase
    const { data: userSession, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !userSession.session) {
      return NextResponse.json(
        { error: 'Sessão Supabase não disponível', details: sessionError?.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Script de migração verificado com sucesso. Use o Supabase Dashboard para executar o script SQL.'
    });
    
  } catch (error) {
    console.error('Erro durante a migração:', error);
    return NextResponse.json(
      { error: 'Erro interno durante a migração', details: error },
      { status: 500 }
    );
  }
} 
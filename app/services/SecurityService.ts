import supabase from '../lib/supabase';

/**
 * Tipos de atividades de segurança
 */
export enum SecurityActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  SIGNUP = 'signup',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  PROFILE_UPDATE = 'profile_update',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  SESSION_TERMINATED = 'session_terminated',
  FAILED_LOGIN = 'failed_login'
}

/**
 * Serviço para gerenciar o registro de atividades de segurança
 */
export default class SecurityService {
  private static instance: SecurityService;
  private userId: string | null = null;

  private constructor() {
    // Construtor privado para implementar o padrão Singleton
    this.checkSession();
  }

  /**
   * Obtém a instância única do serviço
   */
  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Verifica se há uma sessão ativa
   */
  private async checkSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro ao verificar sessão no SecurityService:', error);
        this.userId = null;
        return;
      }
      
      this.userId = data.session?.user.id || null;
    } catch (error) {
      console.error('Exceção ao verificar sessão no SecurityService:', error);
      this.userId = null;
    }
  }

  /**
   * Define o ID do usuário atual
   */
  public async setUserId(userId: string | null) {
    this.userId = userId;
  }

  /**
   * Registra uma atividade de segurança
   */
  public async logActivity(
    activityType: SecurityActivityType,
    description: string,
    metadata: any = null
  ): Promise<boolean> {
    try {
      // Se não houver usuário autenticado, não registrar a atividade
      if (!this.userId && activityType !== SecurityActivityType.LOGIN && activityType !== SecurityActivityType.FAILED_LOGIN) {
        console.warn('Tentativa de registrar atividade sem usuário autenticado:', activityType);
        return false;
      }

      console.log(`Registrando atividade de segurança: ${activityType} - ${description}`);
      
      const { data, error } = await supabase.rpc('log_security_activity', {
        activity_type: activityType,
        description: description,
        metadata: metadata ? JSON.stringify(metadata) : null
      });
      
      if (error) {
        console.error('Erro ao registrar atividade de segurança:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exceção ao registrar atividade de segurança:', error);
      return false;
    }
  }

  /**
   * Registra uma atividade de login bem-sucedida
   */
  public async logLogin(email: string): Promise<boolean> {
    return this.logActivity(
      SecurityActivityType.LOGIN,
      'Login realizado com sucesso',
      { email }
    );
  }

  /**
   * Registra uma atividade de login malsucedida
   */
  public async logFailedLogin(email: string, reason: string): Promise<boolean> {
    return this.logActivity(
      SecurityActivityType.FAILED_LOGIN,
      `Tentativa de login malsucedida: ${reason}`,
      { email }
    );
  }

  /**
   * Registra uma atividade de logout
   */
  public async logLogout(): Promise<boolean> {
    return this.logActivity(
      SecurityActivityType.LOGOUT,
      'Logout realizado com sucesso'
    );
  }

  /**
   * Registra uma atividade de cadastro
   */
  public async logSignup(email: string): Promise<boolean> {
    return this.logActivity(
      SecurityActivityType.SIGNUP,
      'Conta criada com sucesso',
      { email }
    );
  }

  /**
   * Registra uma atividade de alteração de senha
   */
  public async logPasswordChange(): Promise<boolean> {
    return this.logActivity(
      SecurityActivityType.PASSWORD_CHANGE,
      'Senha alterada com sucesso'
    );
  }

  /**
   * Registra uma atividade de redefinição de senha
   */
  public async logPasswordReset(email: string): Promise<boolean> {
    return this.logActivity(
      SecurityActivityType.PASSWORD_RESET,
      'Senha redefinida com sucesso',
      { email }
    );
  }

  /**
   * Registra uma atividade de atualização de perfil
   */
  public async logProfileUpdate(fields: string[]): Promise<boolean> {
    return this.logActivity(
      SecurityActivityType.PROFILE_UPDATE,
      'Perfil atualizado com sucesso',
      { updated_fields: fields }
    );
  }

  /**
   * Registra a ativação da autenticação em duas etapas
   */
  public async logTwoFactorEnabled(): Promise<boolean> {
    return this.logActivity(
      SecurityActivityType.TWO_FACTOR_ENABLED,
      'Autenticação em duas etapas ativada'
    );
  }

  /**
   * Registra a desativação da autenticação em duas etapas
   */
  public async logTwoFactorDisabled(): Promise<boolean> {
    return this.logActivity(
      SecurityActivityType.TWO_FACTOR_DISABLED,
      'Autenticação em duas etapas desativada'
    );
  }

  /**
   * Registra o encerramento de uma sessão
   */
  public async logSessionTerminated(sessionId: string): Promise<boolean> {
    return this.logActivity(
      SecurityActivityType.SESSION_TERMINATED,
      'Sessão encerrada',
      { session_id: sessionId }
    );
  }
} 
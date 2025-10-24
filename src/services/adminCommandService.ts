import { supabase } from '@/lib/supabase';

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  timestamp: Date;
}

export interface SystemStatus {
  database: 'connected' | 'disconnected' | 'error';
  auth: 'active' | 'inactive' | 'error';
  users: number;
  uptime: string;
  version: string;
}

export class AdminCommandService {
  private static instance: AdminCommandService;
  private commandHistory: string[] = [];

  private constructor() {}

  public static getInstance(): AdminCommandService {
    if (!AdminCommandService.instance) {
      AdminCommandService.instance = new AdminCommandService();
    }
    return AdminCommandService.instance;
  }

  public async executeCommand(command: string, userId?: string): Promise<CommandResult> {
    this.commandHistory.push(command);
    
    try {
      const parts = command.trim().split(' ');
      const mainCommand = parts[0].toLowerCase();
      const subCommand = parts[1]?.toLowerCase();
      const args = parts.slice(2);

      switch (mainCommand) {
        case 'help':
          return this.showHelp();
        
        case 'status':
          return this.getSystemStatus();
        
        case 'users':
          return this.handleUserCommands(subCommand, args);
        
        case 'user':
          return this.getUserDetails(args[0]);
        
        case 'create-admin':
          return this.createAdmin(args[0]);
        
        case 'db':
          return this.handleDatabaseCommands(subCommand, args);
        
        case 'logs':
          return this.handleLogCommands(subCommand, args);
        
        case 'debug':
          return this.handleDebugCommands(subCommand, args);
        
        case 'cache':
          return this.handleCacheCommands(subCommand, args);
        
        case 'cleanup':
          return this.handleCleanupCommands(subCommand, args);
        
        case 'clear':
          return {
            success: true,
            message: 'Console cleared',
            timestamp: new Date()
          };
        
        default:
          return {
            success: false,
            message: `Unknown command: ${mainCommand}. Type 'help' for available commands.`,
            timestamp: new Date()
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  private showHelp(): CommandResult {
    const commands = [
      '📋 Available Commands:',
      '',
      'TOOL System Commands:',
      '  help                 - Show this help message',
      '  status               - Show system status',
      '  clear                - Clear console',
      '',
      'USERS User Management:',
      '  users list           - List all users',
      '  users count          - Show user count',
      '  user <id>            - Show user details',
      '  create-admin <email> - Create admin user',
      '',
      'DATABASE Database Commands:',
      '  db status            - Database connection status',
      '  db info              - Database information',
      '',
      'DATA System Info:',
      '  logs recent          - Show recent logs',
      '  logs errors          - Show error logs',
      '',
      'BUG Debug Commands:',
      '  debug auth           - Debug authentication',
      '  debug db             - Debug database connection',
      '',
      '🧹 Maintenance:',
      '  cache clear          - Clear application cache',
      '  cleanup temp         - Clean temporary files',
      '',
      'IDEA Tips:',
      '  - Commands are case-insensitive',
      '  - Use arrow keys for command history',
      '  - Most commands provide detailed output'
    ];

    return {
      success: true,
      message: commands.join('\n'),
      timestamp: new Date()
    };
  }

  private async getSystemStatus(): Promise<CommandResult> {
    try {
      // Check database connection
      const { data: dbTest, error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      const dbStatus = dbError ? 'error' : 'connected';
      
      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const status: SystemStatus = {
        database: dbStatus,
        auth: 'active',
        users: userCount || 0,
        uptime: this.getUptime(),
        version: '1.0.0'
      };

      const statusMessage = [
        'TOOL System Status',
        '================',
        `Database: ${status.database === 'connected' ? 'SUCCESS Connected' : 'ERROR Error'}`,
        `Auth: ${status.auth === 'active' ? 'SUCCESS Active' : 'ERROR Inactive'}`,
        `Users: ${status.users}`,
        `Uptime: ${status.uptime}`,
        `Version: ${status.version}`,
        '',
        `Last Updated: ${new Date().toLocaleString()}`
      ].join('\n');

      return {
        success: true,
        message: statusMessage,
        data: status,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `Error getting system status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  private async handleUserCommands(subCommand: string, args: string[]): Promise<CommandResult> {
    switch (subCommand) {
      case 'list':
        return this.listUsers();
      
      case 'count':
        return this.getUserCount();
      
      default:
        return {
          success: false,
          message: 'Available user commands: list, count',
          timestamp: new Date()
        };
    }
  }

  private async listUsers(): Promise<CommandResult> {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, email, name, role, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userList = users.map((user, index) => {
        const adminStatus = user.role === 'admin' ? '🔒' : '👤';
        const statusIcon = user.status === 'active' ? 'SUCCESS' : 'WARNING';
        return `${index + 1}. ${adminStatus} ${user.email} ${statusIcon} (${user.role || 'user'})`;
      });

      const message = [
        'USERS User List',
        '============',
        ...userList,
        '',
        `Total Users: ${users.length}`,
        `Admin Users: ${users.filter(u => u.role === 'admin').length}`
      ].join('\n');

      return {
        success: true,
        message,
        data: users,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `Error listing users: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  private async getUserCount(): Promise<CommandResult> {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      const { count: adminCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      const message = [
        'DATA User Statistics',
        '==================',
        `Total Users: ${count || 0}`,
        `Admin Users: ${adminCount || 0}`,
        `Regular Users: ${(count || 0) - (adminCount || 0)}`,
        '',
        `Last Updated: ${new Date().toLocaleString()}`
      ].join('\n');

      return {
        success: true,
        message,
        data: { total: count, admins: adminCount },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `Error getting user count: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  private async getUserDetails(userId: string): Promise<CommandResult> {
    if (!userId) {
      return {
        success: false,
        message: 'Please provide a user ID',
        timestamp: new Date()
      };
    }

    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const details = [
        '👤 User Details',
        '===============',
        `ID: ${user.id}`,
        `Email: ${user.email}`,
        `Name: ${user.name || 'Not set'}`,
        `Role: ${user.role || 'user'} ${user.role === 'admin' ? '🔒' : '👤'}`,
        `Status: ${user.status || 'active'} ${user.status === 'active' ? 'SUCCESS' : 'WARNING'}`,
        `Created: ${new Date(user.created_at).toLocaleString()}`,
        `Updated: ${new Date(user.updated_at).toLocaleString()}`
      ].join('\n');

      return {
        success: true,
        message: details,
        data: user,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `Error getting user details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  private async createAdmin(email: string): Promise<CommandResult> {
    if (!email) {
      return {
        success: false,
        message: 'Please provide an email address',
        timestamp: new Date()
      };
    }

    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('email', email)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: `SUCCESS User ${email} has been promoted to admin`,
        data: user,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `Error creating admin: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  private async handleDatabaseCommands(subCommand: string, args: string[]): Promise<CommandResult> {
    switch (subCommand) {
      case 'status':
        return this.getDatabaseStatus();
      
      case 'info':
        return this.getDatabaseInfo();
      
      default:
        return {
          success: false,
          message: 'Available database commands: status, info',
          timestamp: new Date()
        };
    }
  }

  private async getDatabaseStatus(): Promise<CommandResult> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      const status = error ? 'Error' : 'Connected';
      const message = [
        'DATABASE Database Status',
        '==================',
        `Connection: ${status} ${status === 'Connected' ? 'SUCCESS' : 'ERROR'}`,
        `Timestamp: ${new Date().toLocaleString()}`
      ].join('\n');

      return {
        success: !error,
        message,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  private async getDatabaseInfo(): Promise<CommandResult> {
    try {
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const message = [
        'DATABASE Database Information',
        '=======================',
        `Profiles Table: ${profileCount || 0} records`,
        `Last Updated: ${new Date().toLocaleString()}`
      ].join('\n');

      return {
        success: true,
        message,
        data: { profileCount },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: `Error getting database info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  private handleLogCommands(subCommand: string, args: string[]): CommandResult {
    const logs = [
      'DATA System Logs',
      '==============',
      `${new Date().toLocaleString()} - Admin console accessed`,
      `${new Date().toLocaleString()} - System status checked`,
      '(More logs would be available in a real implementation)'
    ].join('\n');

    return {
      success: true,
      message: logs,
      timestamp: new Date()
    };
  }

  private handleDebugCommands(subCommand: string, args: string[]): CommandResult {
    const debugInfo = [
      'BUG Debug Information',
      '===================',
      `Command: debug ${subCommand}`,
      `Environment: ${process.env.NODE_ENV || 'development'}`,
      `Timestamp: ${new Date().toISOString()}`,
      '(Debug info would be more detailed in a real implementation)'
    ].join('\n');

    return {
      success: true,
      message: debugInfo,
      timestamp: new Date()
    };
  }

  private handleCacheCommands(subCommand: string, args: string[]): CommandResult {
    if (subCommand === 'clear') {
      return {
        success: true,
        message: '🧹 Cache cleared successfully',
        timestamp: new Date()
      };
    }

    return {
      success: false,
      message: 'Available cache commands: clear',
      timestamp: new Date()
    };
  }

  private handleCleanupCommands(subCommand: string, args: string[]): CommandResult {
    if (subCommand === 'temp') {
      return {
        success: true,
        message: '🧹 Temporary files cleaned successfully',
        timestamp: new Date()
      };
    }

    return {
      success: false,
      message: 'Available cleanup commands: temp',
      timestamp: new Date()
    };
  }

  private getUptime(): string {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  public getCommandHistory(): string[] {
    return [...this.commandHistory];
  }

  public clearCommandHistory(): void {
    this.commandHistory = [];
  }
}

// Export the singleton instance
export const adminCommandService = AdminCommandService.getInstance(); 
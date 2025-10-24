// DEPRECATED: This file has been replaced by RealAdminConsole.tsx
// The old admin console was full of fake monitoring features that served no purpose.
// 
// WARNING DO NOT USE THIS FILE - Use RealAdminConsole.tsx instead WARNING
//
// The new admin console provides real business management features:
// - Company/Client Management  
// - User Management with real database operations
// - Usage Analytics with actual data
// - System Admin tools for real operations

import React from 'react';
import { RealAdminConsole } from './RealAdminConsole';

interface SystemAdminConsoleProps {
  className?: string;
}

export default function SystemAdminConsole({ className }: SystemAdminConsoleProps) {
  return <RealAdminConsole adminLevel="system_admin" />;
} 
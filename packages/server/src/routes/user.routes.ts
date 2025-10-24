
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { requireAuth, requireRole } from '../auth/requireAuth';
import prisma from '../lib/prisma';

const router = Router();

// Get all users (Admin+ only)
router.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        clientId: true,
        client: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            projectsOwned: true
          }
        }
      },
      orderBy: { email: 'asc' }
    });
    
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      clientId: user.clientId,
      clientName: user.client?.name,
      projectCount: user._count.projectsOwned
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Create user (Admin+ only)
router.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { email, password, name, role, clientId } = req.body;
    
    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Super admins can create any role, Admins can only create STAFF
    if (req.user?.role === 'ADMIN' && role !== 'STAFF') {
      return res.status(403).json({ error: 'Admins can only create staff users' });
    }
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        name,
        role: role || 'STAFF',
        clientId
      }
    });
    
    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      clientId: user.clientId
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get user by ID (Admin+ only)
router.get('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        clientId: true,
        client: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      clientId: user.clientId,
      clientName: user.client?.name
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

// Update user (Admin+ only)
router.put('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, status, clientId } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check permissions for role changes
    if (role && role !== user.role) {
      // Only super admins can change roles
      if (req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Only super admins can change user roles' });
      }
      
      // Cannot change super admin role
      if (user.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Cannot demote a super admin' });
      }
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        role: req.user?.role === 'SUPER_ADMIN' ? role : undefined,
        status,
        clientId
      }
    });
    
    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      status: updatedUser.status,
      clientId: updatedUser.clientId
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Reset user password (Admin+ only)
router.post('/:id/reset-password', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    // Find user
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password
    await prisma.user.update({
      where: { id },
      data: { hashedPassword }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Disable/Enable user (Admin+ only)
router.post('/:id/toggle-status', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Cannot disable super admin
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Cannot disable a super admin' });
    }
    
    // Toggle status
    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: newStatus }
    });
    
    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      status: updatedUser.status
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
});

export default router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '..', 'uploads', 'profiles');
// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userId-timestamp.extension
    const userId = req.user.id;
    const ext = path.extname(file.originalname);
    const filename = `profile-${userId}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch user from database to get latest data including profile_image
    const [users] = await db.promise.execute(
      'SELECT id, name, email, phone, profile_image, user_type, COALESCE(role, CASE WHEN user_type="admin" THEN 0 WHEN user_type="volunteer" THEN 1 ELSE 1 END) AS role, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userData = users[0];
    // Add image field for compatibility with frontend
    if (userData.profile_image) {
      userData.image = userData.profile_image;
    }
    
    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/users
// @desc    Get all users (Permission based)
// @access  Private (Requires user_management permission)
router.get('/', authenticate, checkPermission('user_management'), async (req, res) => {
  try {
    const [users] = await db.promise.execute(
      'SELECT id, name, email, phone, user_type, COALESCE(role, CASE WHEN user_type="admin" THEN 0 WHEN user_type="volunteer" THEN 1 ELSE 1 END) AS role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Users can only view their own profile unless they're admin
    if (req.user.id !== userId && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const [users] = await db.promise.execute(
      'SELECT id, name, email, phone, user_type, COALESCE(role, CASE WHEN user_type="admin" THEN 0 WHEN user_type="volunteer" THEN 1 ELSE 1 END) AS role, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user.id;
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    values.push(userId);
    
    await db.promise.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Get updated user
    const [users] = await db.promise.execute(
      'SELECT id, name, email, phone, profile_image, user_type, COALESCE(role, CASE WHEN user_type="admin" THEN 0 WHEN user_type="volunteer" THEN 1 ELSE 1 END) AS role, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    const userData = users[0];
    // Add image field for compatibility with frontend
    if (userData.profile_image) {
      userData.image = userData.profile_image;
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/users/me/upload-image
// @desc    Upload profile image
// @access  Private
router.post('/me/upload-image', authenticate, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Image file is too large. Maximum size is 5MB.'
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid file type. Only image files are allowed.'
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const userId = req.user.id;
    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    // Update user profile_image in database
    await db.promise.execute(
      'UPDATE users SET profile_image = ? WHERE id = ?',
      [imageUrl, userId]
    );

    // Get updated user
    const [users] = await db.promise.execute(
      'SELECT id, name, email, phone, profile_image, user_type, COALESCE(role, CASE WHEN user_type="admin" THEN 0 WHEN user_type="volunteer" THEN 1 ELSE 1 END) AS role, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        ...users[0],
        image: imageUrl,
        profile_image: imageUrl
      }
    });
  } catch (error) {
    // Delete uploaded file if database update fails
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image'
    });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change password with current password confirmation
// @access  Private (requires authentication)
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide both current password and new password' 
      });
    }
    
    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters long' 
      });
    }
    
    // Get user ID from authenticated user
    const userId = req.user.id;
    
    // Get user's current password hash from database
    const [users] = await db.promise.execute(
      'SELECT id, password FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const user = users[0];
    
    // Verify current password exists
    if (!user.password) {
      return res.status(500).json({ 
        success: false, 
        message: 'User password not set. Contact admin.' 
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be different from current password' 
      });
    }
    
    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password in database
    await db.promise.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, userId]
    );
    
    res.json({ 
      success: true,
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private (Admin)
router.put('/:id/role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const roleId = parseInt(req.body.role);
    
    // Validate role ID
    if (req.body.role === undefined || isNaN(roleId) || roleId < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid role ID is required'
      });
    }
    
    // Check if role exists in roles table
    const [roles] = await db.promise.execute(
      'SELECT id, name, is_active, is_system_role FROM roles WHERE id = ?',
      [roleId]
    );
    
    if (roles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Role does not exist in the database'
      });
    }
    
    const role = roles[0];
    
    // Check if role is active
    if (!role.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign inactive role. Please activate the role first.'
      });
    }
    
    // Prevent admin from removing their own admin role (check if role ID is 0 or role name is "Admin")
    const isAdminRole = roleId === 0 || role.name.toLowerCase() === 'admin';
    if (req.user.id === userId && !isAdminRole) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove your own admin role'
      });
    }
    
    // Update user role
    await db.promise.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [roleId, userId]
    );
    
    // Get updated user
    const [users] = await db.promise.execute(
      'SELECT id, name, email, phone, user_type, COALESCE(role, CASE WHEN user_type="admin" THEN 0 WHEN user_type="volunteer" THEN 1 ELSE 1 END) AS role, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      data: users[0]
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Toggle user active/inactive status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { is_active } = req.body;
    
    // Validate is_active
    if (is_active === undefined || typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_active must be a boolean value'
      });
    }
    
    // Prevent admin from deactivating themselves
    if (req.user.id === userId && !is_active) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }
    
    // Update user status
    await db.promise.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active ? 1 : 0, userId]
    );
    
    // Get updated user
    const [users] = await db.promise.execute(
      'SELECT id, name, email, phone, user_type, COALESCE(role, CASE WHEN user_type="admin" THEN 0 WHEN user_type="volunteer" THEN 1 ELSE 1 END) AS role, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: users[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user details (Admin only)
// @access  Private (Admin)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, phone } = req.body;
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (name !== undefined && name.trim() !== '') {
      updates.push('name = ?');
      values.push(name.trim());
    }
    
    if (email !== undefined && email.trim() !== '') {
      // Check if email already exists (excluding current user)
      const [existingUsers] = await db.promise.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email.trim(), userId]
      );
      
      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      
      updates.push('email = ?');
      values.push(email.trim());
    }
    
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone ? phone.trim() : null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    values.push(userId);
    
    await db.promise.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Get updated user
    const [users] = await db.promise.execute(
      'SELECT id, name, email, phone, user_type, COALESCE(role, CASE WHEN user_type="admin" THEN 0 WHEN user_type="volunteer" THEN 1 ELSE 1 END) AS role, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: users[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Validate user ID
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    // Check if user exists
    const [users] = await db.promise.execute(
      'SELECT id, name, email FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userToDelete = users[0];
    console.log(`Attempting to delete user: ID=${userId}, Name=${userToDelete.name}, Email=${userToDelete.email}`);
    
    // Delete user
    const [result] = await db.promise.execute(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );
    
    console.log(`Delete result - affectedRows: ${result.affectedRows}`);
    
    // Check if deletion was successful
    if (result.affectedRows === 0) {
      console.error(`Delete failed: No rows affected for user ID ${userId}`);
      return res.status(500).json({
        success: false,
        message: 'User could not be deleted. No rows were affected.'
      });
    }
    
    // Verify deletion by checking if user still exists
    const [verifyUsers] = await db.promise.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    
    if (verifyUsers.length > 0) {
      console.error(`Delete verification failed: User still exists after deletion attempt`);
      return res.status(500).json({
        success: false,
        message: 'Delete operation completed but user still exists in database'
      });
    }
    
    console.log(`User ${userId} successfully deleted`);
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      deletedId: userId,
      deletedUser: {
        id: userToDelete.id,
        name: userToDelete.name,
        email: userToDelete.email
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Log registered routes for debugging
if (process.env.NODE_ENV !== 'production') {
  console.log('User routes registered:', {
    'PUT /api/users/:id/role': 'Active',
    'PUT /api/users/:id/status': 'Active',
    'PUT /api/users/:id': 'Active',
    'DELETE /api/users/:id': 'Active'
  });
}

module.exports = router;


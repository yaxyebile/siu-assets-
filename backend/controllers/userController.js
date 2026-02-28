const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { createLog } = require('../utils/activityLogger');

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (admin only)
 */
const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/users/:id
 * @desc    Get single user
 * @access  Private
 */
const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/users/role/:role
 * @desc    Get users by role
 * @access  Private
 */
const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;

        const users = await User.find({ role }).select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get users by role error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (admin/adminOfficer only)
 */
const createUser = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            phone,
            role
        });

        // Log activity
        await createLog('User Created', req.user, `Created user: ${user.name} (${user.role})`);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (admin/adminOfficer only)
 */
const updateUser = async (req, res) => {
    try {
        const { name, email, phone, role } = req.body;

        let user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields
        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.role = role || user.role;

        await user.save();

        // Log activity
        await createLog('User Updated', req.user, `Updated user: ${user.name}`);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (admin only)
 */
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Prevent adminOfficer from deleting admin or adminOfficer
        if (req.user.role === 'adminOfficer' && (user.role === 'admin' || user.role === 'adminOfficer')) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this user'
            });
        }

        await user.deleteOne();

        // Log activity
        await createLog('User Deleted', req.user, `Deleted user: ${user.name}`);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/users/:id/password
 * @desc    Change user password
 * @access  Private
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Only allow users to change their own password or admin to change any
        if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to change this password'
            });
        }

        const user = await User.findById(req.params.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // If not admin, verify current password
        if (req.user.role !== 'admin') {
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Log activity
        await createLog('Password Changed', req.user, `Changed password for: ${user.name}`);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getUsers,
    getUser,
    getUsersByRole,
    createUser,
    updateUser,
    deleteUser,
    changePassword
};

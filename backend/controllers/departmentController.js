const Department = require('../models/Department');
const { createLog } = require('../utils/activityLogger');

/**
 * @route   GET /api/departments
 * @desc    Get all departments
 * @access  Private
 */
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });

        res.json({
            success: true,
            count: departments.length,
            data: departments
        });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/departments/:id
 * @desc    Get single department
 * @access  Private
 */
const getDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        res.json({
            success: true,
            data: department
        });
    } catch (error) {
        console.error('Get department error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/departments
 * @desc    Create department
 * @access  Private (admin/adminOfficer only)
 */
const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if department exists
        const departmentExists = await Department.findOne({ name });
        if (departmentExists) {
            return res.status(400).json({
                success: false,
                message: 'Department with this name already exists'
            });
        }

        const department = await Department.create({ name, description });

        // Log activity
        await createLog('Department Created', req.user, `Created department: ${department.name}`);

        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            data: department
        });
    } catch (error) {
        console.error('Create department error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department
 * @access  Private (admin/adminOfficer only)
 */
const updateDepartment = async (req, res) => {
    try {
        let department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        department = await Department.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        // Log activity
        await createLog('Department Updated', req.user, `Updated department: ${department.name}`);

        res.json({
            success: true,
            message: 'Department updated successfully',
            data: department
        });
    } catch (error) {
        console.error('Update department error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete department
 * @access  Private (admin only)
 */
const deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        // Check if department is used by any assets
        const Asset = require('../models/Asset');
        const assetsCount = await Asset.countDocuments({ department: req.params.id });

        if (assetsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete department. It is assigned to ${assetsCount} asset(s)`
            });
        }

        await department.deleteOne();

        // Log activity
        await createLog('Department Deleted', req.user, `Deleted department: ${department.name}`);

        res.json({
            success: true,
            message: 'Department deleted successfully'
        });
    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment
};

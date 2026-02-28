const Category = require('../models/Category');
const { createLog } = require('../utils/activityLogger');

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Private
 */
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });

        res.json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category
 * @access  Private
 */
const getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/categories
 * @desc    Create category
 * @access  Private (admin/adminOfficer only)
 */
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if category exists
        const categoryExists = await Category.findOne({ name });
        if (categoryExists) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        const category = await Category.create({ name, description });

        // Log activity
        await createLog('Category Created', req.user, `Created category: ${category.name}`);

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (admin/adminOfficer only)
 */
const updateCategory = async (req, res) => {
    try {
        let category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        // Log activity
        await createLog('Category Updated', req.user, `Updated category: ${category.name}`);

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private (admin only)
 */
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if category is used by any assets
        const Asset = require('../models/Asset');
        const assetsCount = await Asset.countDocuments({ category: req.params.id });

        if (assetsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It is assigned to ${assetsCount} asset(s)`
            });
        }

        await category.deleteOne();

        // Log activity
        await createLog('Category Deleted', req.user, `Deleted category: ${category.name}`);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
};

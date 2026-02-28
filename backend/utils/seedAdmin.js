require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        await connectDB();

        console.log('🌱 Starting database seeding...\n');

        // Check if admin user already exists
        const adminExists = await User.findOne({ role: 'admin' });

        if (adminExists) {
            console.log('⚠️  Admin user already exists. Skipping user creation.');
        } else {
            // Create default admin user
            const admin = await User.create({
                name: 'Super Admin',
                email: 'admin@siu.com',
                password: 'admin123',
                phone: '252612345678',
                role: 'admin'
            });

            console.log('✅ Admin user created:');
            console.log('   Email: admin@siu.com');
            console.log('   Password: admin123');
            console.log('   Role: admin\n');
        }

        // Create sample departments
        const departmentCount = await Department.countDocuments();

        if (departmentCount === 0) {
            const departments = await Department.insertMany([
                { name: 'IT Department', description: 'Information Technology' },
                { name: 'Finance Department', description: 'Financial Management' },
                { name: 'HR Department', description: 'Human Resources' },
                { name: 'Operations', description: 'Operational Activities' },
                { name: 'Security', description: 'Security and Safety' }
            ]);

            console.log(`✅ Created ${departments.length} departments\n`);
        } else {
            console.log('⚠️  Departments already exist. Skipping department creation.\n');
        }

        // Create sample categories
        const categoryCount = await Category.countDocuments();

        if (categoryCount === 0) {
            const categories = await Category.insertMany([
                { name: 'Computers', description: 'Desktop and Laptop computers' },
                { name: 'Furniture', description: 'Office furniture and equipment' },
                { name: 'Vehicles', description: 'Company vehicles' },
                { name: 'Electronics', description: 'Electronic devices and equipment' },
                { name: 'Office Supplies', description: 'General office supplies' },
                { name: 'Network Equipment', description: 'Routers, switches, and network devices' }
            ]);

            console.log(`✅ Created ${categories.length} categories\n`);
        } else {
            console.log('⚠️  Categories already exist. Skipping category creation.\n');
        }

        console.log('✨ Database seeding completed successfully!\n');
        console.log('═══════════════════════════════════════════════');
        console.log('You can now start the server with: npm start');
        console.log('Or in development mode with: npm run dev');
        console.log('═══════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};

seedData();

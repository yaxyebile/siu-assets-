require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected');

        // Delete all admin users
        const result = await User.deleteMany({ role: 'admin' });
        console.log(`🗑️  Deleted ${result.deletedCount} admin user(s)`);

        // Create new admin user
        const admin = await User.create({
            name: 'Super Admin',
            email: 'admin@siu.com',
            password: 'admin123',
            phone: '252612345678',
            role: 'admin'
        });

        console.log('✅ New admin user created:');
        console.log('   Email: admin@siu.com');
        console.log('   Password: admin123');
        console.log('   Role: admin');
        console.log('\n✨ Admin reset completed successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Reset error:', error);
        process.exit(1);
    }
};

resetAdmin();

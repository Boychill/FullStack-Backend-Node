const mongoose = require('mongoose');
const dotenv = require('dotenv');
const products = require('../frontend/src/data/products.json');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const connectDB = require('./config/db');

dotenv.config();

const importData = async () => {
    try {
        await connectDB();

        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        const createdUsers = await User.create([
            {
                name: 'Admin User',
                email: 'admin@admin.com',
                password: 'admin123',
                role: 'admin',
                addresses: []
            },
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: '123123',
                role: 'customer',
                addresses: []
            }
        ]);

        const adminUser = createdUsers[0]._id;

        const sampleProducts = products.map((product) => {
            // Remove id from json to let mongo generate _id, or keep it if we want custom ids.
            // Frontend uses string ids (e.g. "1"). Mongoose uses ObjectIds usually.
            // Keeping them might cause issues if Schema expects ObjectId for references but here we are just inserting products.
            // My Product Schema has timestamps, and _id is default.
            // The JSON has "id": "1".
            // Mongoose will create a new _id (ObjectId) unless I explicitly set _id.
            // If I keep "id" field in schema, it will be stored.
            // Let's check Product Schema...
            // "combinations" has "id". But top level?
            // "id" is not in the schema top level explicitly, but "slug" is.
            // I should probably remove "id" and let Mongo handle it, OR map "id" to something else if needed.
            // The frontend relies on these IDs.
            // If I change IDs, frontend might break if it hardcodes them (unlikely for dynamic app, but "products.json" implies static).
            // However, since I'm switching to backend, the frontend should use the ID returned by backend.
            // So removing "id" from JSON and letting Mongo generate `_id` is the right way.
            const { id, ...rest } = product;
            return { ...rest, user: adminUser };
        });

        await Product.insertMany(sampleProducts);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}

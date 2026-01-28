const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    images: [{ type: String }],
    // Specific attributes
    sizes: [{ type: String }],
    colors: [{ type: String }],
    material: { type: String },
    specs: {
        ram: String,
        storage: String,
        processor: String,
        warranty: String,
    },
    stock: { type: Number, required: true, default: 0 },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    attributes: [{
        name: String,
        options: [{ type: String }]
    }],
    combinations: [{
        id: String,
        values: { type: Map, of: String },
        stock: Number
    }]
}, {
    timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

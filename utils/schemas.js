const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const productSchema = Joi.object({
    name: Joi.string().required(),
    slug: Joi.string(),
    price: Joi.number().min(0).required(),
    description: Joi.string().required(),
    category: Joi.string().required(),
    images: Joi.array().items(Joi.string()),
    stock: Joi.number().min(0).default(0),
    attributes: Joi.array(),
    combinations: Joi.array(),
    specs: Joi.object(),
    sizes: Joi.array(),
    colors: Joi.array(),
    rating: Joi.number(),
    reviews: Joi.number(),
    featured: Joi.boolean()
});

module.exports = {
    registerSchema,
    loginSchema,
    productSchema,
};

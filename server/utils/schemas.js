const Joi = require('joi');

const clientSchema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        'string.empty': 'İsim alanı boş bırakılamaz.',
        'string.min': 'İsim en az 2 karakter olmalıdır.',
        'any.required': 'İsim alanı zorunludur.'
    }),
    phone: Joi.string().pattern(/^[0-9+\s()-]+$/).min(10).max(20).optional().allow('').messages({
        'string.pattern.base': 'Geçerli bir telefon numarası giriniz.',
    }),
    email: Joi.string().email().optional().allow('').messages({
        'string.email': 'Geçerli bir e-posta adresi giriniz.'
    }),
    notes: Joi.string().max(1000).optional().allow(''),
    type: Joi.string().valid('buyer', 'seller').optional().default('buyer')
});

const demandSchema = Joi.object({
    min_price: Joi.number().min(0).optional().allow(null),
    max_price: Joi.number().min(Joi.ref('min_price')).optional().allow(null).messages({
        'number.min': 'Maksimum fiyat, minimum fiyattan küçük olamaz.'
    }),
    rooms: Joi.string().optional().allow(''),
    district: Joi.string().optional().allow(''),
    neighborhood: Joi.string().optional().allow('')
});

const authSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Geçerli bir e-posta adresi giriniz.',
        'any.required': 'E-posta alanı zorunludur.'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Şifre en az 6 karakter olmalıdır.',
        'any.required': 'Şifre alanı zorunludur.'
    })
});

const listingSchema = Joi.object({
    propertyId: Joi.alternatives().try(Joi.number().integer(), Joi.string().regex(/^\d+$/)).required(),
    title: Joi.string().max(200).optional().allow(null, ''),
    description: Joi.string().max(5000).optional().allow(null, '')
});

module.exports = { clientSchema, demandSchema, authSchema, listingSchema };

import * as Joi from 'joi';

export const validationSchema = Joi.object({
	NODE_ENV: Joi.string().valid('development', 'production', 'staging', 'test').required(),
	ENVIRONMENT: Joi.string().valid('development', 'production', 'staging').required(),

	PORT: Joi.number().required(),

	IPFS_PUBLIC_KEY: Joi.string().required(),
	IPFS_SECRET_KEY: Joi.string().required(),
	IPFS_API: Joi.string().required(),
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const configuration = () => ({
	version: process.env.npm_package_version,
	env: process.env.NODE_ENV,
	environment: process.env.ENVIRONMENT,
	port: parseInt(process.env.PORT, 10) || 3000,
	ipfs: {
		publicKey: process.env.IPFS_PUBLIC_KEY,
		secretKey: process.env.IPFS_SECRET_KEY,
		api: process.env.IPFS_API,
	},
});

export const validationOptions = {
	abortEarly: true,
};

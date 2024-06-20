import factory from '@adonisjs/lucid/factories';

import User from '#models/user';

export const UserFactory = factory
	.define(User, ({ faker }) => ({
		email: faker.internet.email().toLowerCase(),
		password: faker.internet.password(),
		isVerified: false,
	}))
	.state('verified', (user) => {
		user.isVerified = true;
	})
	.build();

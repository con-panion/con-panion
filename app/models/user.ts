import { withAuthFinder } from '@adonisjs/auth/mixins/lucid';
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session';
import { compose } from '@adonisjs/core/helpers';
import hash from '@adonisjs/core/services/hash';
import { BaseModel, column } from '@adonisjs/lucid/orm';
import { DateTime } from 'luxon';

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
	uids: ['email'],
	passwordColumnName: 'password',
});

export default class User extends compose(BaseModel, AuthFinder) {
	static rememberMeTokens = DbRememberMeTokensProvider.forModel(User);

	@column({ isPrimary: true })
	declare id: number;

	@column()
	declare email: string;

	@column()
	declare password: string;

	@column()
	declare rememberMeToken: string | null;

	@column()
	declare isVerified: boolean;

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime | null;
}

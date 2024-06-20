import { fn } from 'jest-mock';

import type User from '#models/user';
import PasswordResetService from '#services/password-reset-service';

export default class MockPasswordResetService extends PasswordResetService {
	generateToken = fn((user: User | null) => super.generateToken(user));
	clearTokens = fn((user: User) => super.clearTokens(user));
	getUserByToken = fn((token: string) => super.getUserByToken(token));
	verifyToken = fn((token: string) => super.verifyToken(token));
}

import path from 'node:path';

import { authBrowserClient } from '@adonisjs/auth/plugins/browser_client';
import app from '@adonisjs/core/services/app';
import testUtils from '@adonisjs/core/services/test_utils';
import { inertiaApiClient } from '@adonisjs/inertia/plugins/api_client';
import { sessionApiClient } from '@adonisjs/session/plugins/api_client';
import { sessionBrowserClient } from '@adonisjs/session/plugins/browser_client';
import { shieldApiClient } from '@adonisjs/shield/plugins/api_client';
import { izzyRoutePlugin } from '@izzyjs/route/plugins/japa';
import { apiClient } from '@japa/api-client';
import { assert } from '@japa/assert';
import { browserClient } from '@japa/browser-client';
import { pluginAdonisJS } from '@japa/plugin-adonisjs';
import type { Config } from '@japa/runner/types';
import { snapshot } from '@japa/snapshot';

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [
	assert(),
	izzyRoutePlugin(),
	pluginAdonisJS(app),
	apiClient(),
	inertiaApiClient(app),
	sessionApiClient(app),
	shieldApiClient(),
	browserClient({
		runInSuites: ['browser'],
		contextOptions: {
			baseURL: 'http://localhost:3333',
		},
		tracing: {
			enabled: false,
			event: 'onError',
			cleanOutputDirectory: true,
			outputDirectory: path.join(import.meta.dirname, './traces'),
		},
	}),
	sessionBrowserClient(app),
	authBrowserClient(app),
	snapshot(),
];

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executer after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
	setup: [() => testUtils.db().truncate()],
	teardown: [],
};

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
	if (['browser', 'functional', 'e2e'].includes(suite.name)) {
		return suite.setup(() => testUtils.httpServer().start());
	}
};

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */

import { toNestErrors, validateFieldsNatively } from '@hookform/resolvers';
import { errors, type SimpleErrorReporter, type VineValidator } from '@vinejs/vine';
import type { ValidationOptions } from '@vinejs/vine/types';
import {
	appendErrors,
	type FieldError,
	type FieldErrors,
	type FieldValues,
	type ResolverOptions,
	type ResolverResult,
} from 'react-hook-form';

export type Resolver = <T extends VineValidator<any, any>>(
	schema: T,
	schemaOptions?: ValidationOptions<any>,
	resolverOptions?: { raw?: boolean },
) => <TFieldValues extends FieldValues, TContext>(
	values: TFieldValues,
	context: TContext | undefined,
	options: ResolverOptions<TFieldValues>,
) => Promise<ResolverResult<TFieldValues>>;

const parseErrorSchema = (vineErrors: SimpleErrorReporter['errors'], validateAllFieldCriteria: boolean) => {
	const schemaErrors: Record<string, FieldError> = {};

	for (const error of vineErrors) {
		const { field, rule, message } = error;
		const path = field;

		if (!(path in schemaErrors)) {
			schemaErrors[path] = { message, type: rule };
		}

		if (validateAllFieldCriteria) {
			const { types } = schemaErrors[path];
			const messages = types && types[rule];

			schemaErrors[path] = appendErrors(
				path,
				validateAllFieldCriteria,
				schemaErrors,
				rule,
				messages ? [...(messages as string[]), message] : message,
			) as FieldError;
		}
	}

	return schemaErrors;
};

export const vineResolver: Resolver =
	(schema, schemaOptions, resolverOptions = {}) =>
	async (values, _, options) => {
		try {
			const data = await schema.validate(values, schemaOptions);

			if (options.shouldUseNativeValidation) {
				validateFieldsNatively({}, options);
			}

			return {
				errors: {} as FieldErrors,
				values: resolverOptions.raw ? values : data,
			};
		} catch (error: unknown) {
			if (error instanceof errors.E_VALIDATION_ERROR) {
				return {
					values: {},
					errors: toNestErrors(
						parseErrorSchema(
							error.messages as SimpleErrorReporter['errors'],
							!options.shouldUseNativeValidation && options.criteriaMode === 'all',
						),
						options,
					),
				};
			}

			throw error;
		}
	};

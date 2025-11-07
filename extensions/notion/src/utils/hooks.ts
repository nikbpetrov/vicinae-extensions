import { useEffect, useState, useCallback, useRef } from "react";

// Simple implementation of useCachedPromise for Vicinae
export function useCachedPromise<T, U extends any[] = []>(
	fn:
		| ((...args: U) => Promise<T>)
		| ((
				...args: U
		  ) => (
				cursor?: any,
		  ) => Promise<{ data: T; hasMore: boolean; cursor?: any }>)
		| (() => Promise<T>),
	args?: U | [],
	options?: { execute?: boolean; keepPreviousData?: boolean },
): {
	data: T | undefined;
	isLoading: boolean;
	error: Error | undefined;
	mutate: () => Promise<void>;
	pagination?: {
		hasMore: boolean;
		onLoadMore: () => void;
	};
} {
	const [data, setData] = useState<T | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | undefined>(undefined);
	const previousDataRef = useRef<T | undefined>(undefined);
	const execute = options?.execute !== false;
	const [paginationState, setPaginationState] = useState<{
		hasMore: boolean;
		cursor?: any;
	}>({ hasMore: false });

	const fetchData = useCallback(
		async (cursor?: any) => {
			if (!execute) {
				setIsLoading(false);
				return;
			}

			setIsLoading(true);
			setError(undefined);

			try {
				// Check if fn returns a pagination function
				if (typeof fn === "function" && fn.length > 0) {
					const paginationFn =
						args && args.length > 0
							? (
									fn as (
										...args: U
									) => (
										cursor?: any,
									) => Promise<{ data: T; hasMore: boolean; cursor?: any }>
								)(...(args as U))
							: null;

					if (paginationFn && typeof paginationFn === "function") {
						// This is a pagination function
						const result = await paginationFn(cursor);
						if (cursor) {
							// Append to existing data
							setData((prev) => {
								if (Array.isArray(prev) && Array.isArray(result.data)) {
									return [...prev, ...result.data] as T;
								}
								return result.data;
							});
						} else {
							setData(result.data);
							previousDataRef.current = result.data;
						}
						setPaginationState({
							hasMore: result.hasMore,
							cursor: result.cursor,
						});
					} else {
						// Regular function call
						const result =
							args && args.length > 0
								? await (fn as (...args: U) => Promise<T>)(...(args as U))
								: await (fn as () => Promise<T>)();
						setData(result);
						previousDataRef.current = result;
					}
				} else {
					// Regular function call
					const result =
						args && args.length > 0
							? await (fn as (...args: U) => Promise<T>)(...(args as U))
							: await (fn as () => Promise<T>)();
					setData(result);
					previousDataRef.current = result;
				}
			} catch (err) {
				setError(err instanceof Error ? err : new Error(String(err)));
				if (options?.keepPreviousData && previousDataRef.current) {
					setData(previousDataRef.current);
				}
			} finally {
				setIsLoading(false);
			}
		},
		[fn, args, execute, options?.keepPreviousData],
	);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const mutate = useCallback(async () => {
		await fetchData();
	}, [fetchData]);

	const onLoadMore = useCallback(() => {
		if (paginationState.hasMore && !isLoading) {
			fetchData(paginationState.cursor);
		}
	}, [paginationState, isLoading, fetchData]);

	return {
		data,
		isLoading,
		error,
		mutate,
		pagination: paginationState.hasMore
			? {
					hasMore: paginationState.hasMore,
					onLoadMore,
				}
			: undefined,
	};
}

// Simple implementation of useForm for Vicinae
export function useForm<T extends Record<string, any>>(options: {
	initialValues?: Partial<T>;
	validation?: Record<string, ((value: any) => string | undefined) | undefined>;
	onSubmit: (values: T) => Promise<void> | void;
}): {
	itemProps: Record<string, any>;
	values: T;
	handleSubmit: (values: T) => Promise<void>;
	setValue: (key: keyof T, value: any) => void;
	reset: (values?: Partial<T>) => void;
	focus: (key: keyof T) => void;
} {
	const [values, setValues] = useState<Partial<T>>(options.initialValues || {});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validate = useCallback(
		(vals: Partial<T>): boolean => {
			if (!options.validation) return true;

			const newErrors: Record<string, string> = {};
			let isValid = true;

			for (const [key, validator] of Object.entries(options.validation)) {
				if (validator) {
					const error = validator(vals[key as keyof T]);
					if (error) {
						newErrors[key] = error;
						isValid = false;
					}
				}
			}

			setErrors(newErrors);
			return isValid;
		},
		[options.validation],
	);

	const handleSubmit = useCallback(
		async (vals: T) => {
			if (!validate(vals)) {
				return;
			}

			await options.onSubmit(vals as T);
		},
		[options, validate],
	);

	const setValue = useCallback(
		(key: keyof T, value: any) => {
			setValues((prev) => ({ ...prev, [key]: value }));
			// Clear error for this field
			if (errors[key as string]) {
				setErrors((prev) => {
					const newErrors = { ...prev };
					delete newErrors[key as string];
					return newErrors;
				});
			}
		},
		[errors],
	);

	const reset = useCallback(
		(newValues?: Partial<T>) => {
			setValues(newValues || options.initialValues || {});
			setErrors({});
		},
		[options.initialValues],
	);

	const focus = useCallback((key: keyof T) => {
		// Focus is handled by the Form component itself via autoFocus
		// This is a no-op for now
	}, []);

	// Build itemProps for all fields in initialValues and current values
	const itemProps: Record<string, any> = {};
	const allKeys = new Set([
		...Object.keys(options.initialValues || {}),
		...Object.keys(values),
	]);

	for (const key of allKeys) {
		itemProps[key] = {
			id: key,
			value: values[key],
			error: errors[key],
			onChange: (newValue: any) => setValue(key as keyof T, newValue),
		};
	}

	return {
		itemProps,
		values: values as T,
		handleSubmit,
		setValue,
		reset,
		focus,
	};
}

// FormValidation constants
export const FormValidation = {
	Required: (value: any) => {
		if (!value || (typeof value === "string" && value.trim() === "")) {
			return "This field is required";
		}
		return undefined;
	},
};

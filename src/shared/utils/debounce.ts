export function debounce<T extends unknown[], U>(callback: (...args: T) => PromiseLike<U> | U, wait: number) {
	let timer: ReturnType<typeof setTimeout>;

	return async (...args: T): Promise<U> => {
		clearTimeout(timer);
		return await new Promise(resolve => {
			timer = setTimeout(() => resolve(callback(...args)), wait);
		});
	};
}

const timeoutPromise = async (ms?: number | undefined): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export default timeoutPromise;

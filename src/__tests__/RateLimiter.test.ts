import RateLimiter from "../AsyncBatch/RateLimiter";

describe("RateLimiter Tests", () => {
	test("Instance of RateLimiter", async () => {
		expect(RateLimiter.new(3, 200)).toBeInstanceOf(RateLimiter);
	});

	test("Throw Error: Too many shots", async () => {
		const rateLimiter = RateLimiter.new(3, 200);
		rateLimiter.shot();
		rateLimiter.shot();
		rateLimiter.shot();
		expect(() => rateLimiter.shot()).toThrow(Error);
	});

	test("Sliding window maxShot 3 in 200ms", async () => {
		const rateLimiter = RateLimiter.new(3, 200);

		// Test 1
		rateLimiter.shot();
		let start = performance.now();
		await rateLimiter.wait();
		let end = performance.now();
		expect(end - start).toBeLessThan(1);

		// Test 2
		rateLimiter.shot();
		start = performance.now();
		await rateLimiter.wait();
		end = performance.now();
		expect(end - start).toBeLessThan(1);

		// Test 3
		rateLimiter.shot();
		start = performance.now();
		await rateLimiter.wait();
		end = performance.now();
		expect(end - start).toBeGreaterThanOrEqual(200);

		// Test 4
		rateLimiter.shot();
		rateLimiter.shot();
		start = performance.now();
		await Promise.all([rateLimiter.wait(), rateLimiter.wait()]);
		end = performance.now();
		expect(end - start).toBeLessThan(1);
	});
});

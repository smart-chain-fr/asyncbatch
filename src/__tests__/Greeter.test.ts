import { Greeter } from "../main";
test("My Greeter", () => {
	expect(Greeter("Carl")).toBe("Hello Carl");
});

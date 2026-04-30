import { hash, verify } from "@node-rs/argon2";

const ARGON_OPTIONS = {
	memoryCost: 19456,
	timeCost: 2,
	parallelism: 1,
	outputLen: 32,
} as const;

export async function hashPin(pin: string): Promise<string> {
	return hash(pin, ARGON_OPTIONS);
}

export async function verifyPin(pin: string, h: string): Promise<boolean> {
	return verify(h, pin);
}

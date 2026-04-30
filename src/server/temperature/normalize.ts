export type TemperatureUnit = "C" | "F";

export type NormalizedTemperature = {
	valueC: number;
	valueF: number;
	unit: TemperatureUnit;
};

function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

export function normalizeTemperature(
	value: number,
	unit: TemperatureUnit,
): NormalizedTemperature {
	if (!Number.isFinite(value)) {
		throw new Error("Temperature must be a finite number");
	}
	const valueC = unit === "C" ? value : ((value - 32) * 5) / 9;
	const valueF = unit === "F" ? value : (value * 9) / 5 + 32;
	return { valueC: round2(valueC), valueF: round2(valueF), unit };
}

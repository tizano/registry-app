export const MONTREAL_TZ = "America/Toronto";

const MONTHS_FR = [
	"Janvier",
	"Février",
	"Mars",
	"Avril",
	"Mai",
	"Juin",
	"Juillet",
	"Août",
	"Septembre",
	"Octobre",
	"Novembre",
	"Décembre",
] as const;

export type MontrealParts = {
	year: string;
	month: string;
	day: string;
	hour: string;
	minute: string;
};

const partsFormatter = new Intl.DateTimeFormat("fr-CA", {
	timeZone: MONTREAL_TZ,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	hourCycle: "h23",
});

export function montrealParts(date: Date): MontrealParts {
	const out: Record<string, string> = {};
	for (const p of partsFormatter.formatToParts(date)) {
		if (p.type !== "literal") out[p.type] = p.value;
	}
	return {
		year: out.year,
		month: out.month,
		day: out.day,
		hour: out.hour,
		minute: out.minute,
	};
}

export function buildPhotoFilename(date: Date, ext = "webp"): string {
	const p = montrealParts(date);
	return `${p.year}-${p.month}-${p.day}_${p.hour}-${p.minute}.${ext}`;
}

export function monthFolderName(date: Date): string {
	const p = montrealParts(date);
	const idx = Number(p.month) - 1;
	return `${p.month}-${MONTHS_FR[idx]}`;
}

export function yearFolderName(date: Date): string {
	return montrealParts(date).year;
}

export function dateLabel(date: Date): string {
	const p = montrealParts(date);
	return `${p.year}-${p.month}-${p.day}`;
}

export function timeLabel(date: Date): string {
	const p = montrealParts(date);
	return `${p.hour}:${p.minute}`;
}

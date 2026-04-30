import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getSessionFromRequest } from "#/server/auth/session.ts";
import { createTemperatureEntry } from "#/server/registre/create.ts";

const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
const MAX_NOTE_LEN = 500;

const inputSchema = z.object({
	value: z.coerce.number().finite(),
	unit: z.enum(["C", "F"]),
	note: z.string().max(MAX_NOTE_LEN).optional(),
});

async function handler({ request }: { request: Request }) {
	const session = await getSessionFromRequest(request);
	if (!session) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return Response.json({ error: "Invalid multipart body" }, { status: 400 });
	}

	const photoField = form.get("photo");
	if (!(photoField instanceof File)) {
		return Response.json({ error: "Missing photo" }, { status: 400 });
	}
	if (photoField.size === 0) {
		return Response.json({ error: "Empty photo" }, { status: 400 });
	}
	if (photoField.size > MAX_PHOTO_BYTES) {
		return Response.json({ error: "Photo too large" }, { status: 413 });
	}

	const parsed = inputSchema.safeParse({
		value: form.get("value"),
		unit: form.get("unit"),
		note: typeof form.get("note") === "string" ? form.get("note") : undefined,
	});
	if (!parsed.success) {
		return Response.json(
			{ error: "Invalid input", issues: parsed.error.issues },
			{ status: 400 },
		);
	}

	const buffer = Buffer.from(await photoField.arrayBuffer());

	try {
		const result = await createTemperatureEntry({
			photo: buffer,
			value: parsed.data.value,
			unit: parsed.data.unit,
			note: parsed.data.note?.trim() || null,
		});
		return Response.json({ ok: true, ...result });
	} catch (err) {
		console.error("createTemperatureEntry failed", err);
		return Response.json({ error: "Internal error" }, { status: 500 });
	}
}

export const Route = createFileRoute("/api/registre/temperature")({
	server: {
		handlers: {
			POST: handler,
		},
	},
});

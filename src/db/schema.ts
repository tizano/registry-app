import {
	boolean,
	index,
	integer,
	numeric,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const authPin = pgTable("auth_pin", {
	id: serial().primaryKey(),
	hash: text().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const authPinChanges = pgTable("auth_pin_changes", {
	id: serial().primaryKey(),
	changedAt: timestamp("changed_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	ip: text(),
	userAgent: text("user_agent"),
});

export const authAttempts = pgTable(
	"auth_attempts",
	{
		id: serial().primaryKey(),
		ip: text().notNull(),
		userAgent: text("user_agent"),
		success: boolean().notNull(),
		attemptedAt: timestamp("attempted_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("auth_attempts_ip_attempted_at_idx").on(table.ip, table.attemptedAt),
	],
);

export const sessions = pgTable("sessions", {
	id: text().primaryKey(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	ip: text(),
	userAgent: text("user_agent"),
});

export const phEntries = pgTable(
	"ph_entries",
	{
		id: serial().primaryKey(),
		value: numeric({ precision: 4, scale: 2, mode: "number" }).notNull(),
		note: text(),
		photoDriveId: text("photo_drive_id").notNull(),
		photoUrl: text("photo_url").notNull(),
		sheetRowSynced: boolean("sheet_row_synced").notNull().default(false),
		capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [index("ph_entries_captured_at_idx").on(table.capturedAt)],
);

export const temperatureEntries = pgTable(
	"temperature_entries",
	{
		id: serial().primaryKey(),
		valueC: numeric("value_c", {
			precision: 6,
			scale: 2,
			mode: "number",
		}).notNull(),
		valueF: numeric("value_f", {
			precision: 6,
			scale: 2,
			mode: "number",
		}).notNull(),
		unit: varchar({ length: 1, enum: ["C", "F"] }).notNull(),
		note: text(),
		photoDriveId: text("photo_drive_id").notNull(),
		photoUrl: text("photo_url").notNull(),
		sheetRowSynced: boolean("sheet_row_synced").notNull().default(false),
		capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("temperature_entries_captured_at_idx").on(table.capturedAt),
	],
);

export const syncFailures = pgTable("sync_failures", {
	id: serial().primaryKey(),
	entryType: varchar("entry_type", {
		length: 16,
		enum: ["ph", "temperature"],
	}).notNull(),
	entryId: integer("entry_id").notNull(),
	target: varchar({ length: 16, enum: ["drive", "sheet"] }).notNull(),
	error: text().notNull(),
	attempts: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const REGISTRY_FOLDERS = {
	ph: "Registre ph assainisseur",
	temperature: "Registre température plonge",
} as const;

export type RegistryType = keyof typeof REGISTRY_FOLDERS;

export function registryFolderName(type: RegistryType): string {
	return REGISTRY_FOLDERS[type];
}

export function spreadsheetName(type: RegistryType, year: string): string {
	return `${REGISTRY_FOLDERS[type]} - ${year}`;
}

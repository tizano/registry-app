import sharp from "sharp";

const MAX_DIMENSION = 1280;
const WEBP_QUALITY = 80;

export type ProcessedImage = {
	buffer: Buffer;
	mimeType: "image/webp";
	extension: "webp";
};

export async function processImage(
	input: Buffer | Uint8Array,
): Promise<ProcessedImage> {
	const buffer = await sharp(input)
		.rotate()
		.resize(MAX_DIMENSION, MAX_DIMENSION, {
			fit: "inside",
			withoutEnlargement: true,
		})
		.webp({ quality: WEBP_QUALITY })
		.toBuffer();

	return { buffer, mimeType: "image/webp", extension: "webp" };
}

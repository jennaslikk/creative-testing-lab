import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const key = env.OPENROUTER_API_KEY;
  if (!key || key === 'your_key_here') return json({ error: 'Add your OpenRouter API key to the .env file first.' }, { status: 400 });
  try {
    const body = await request.json();
    const { headline, cta, image, brand, audience, palette, layout, ratio, model } = body;
    if (![headline, cta, image, brand, layout].every((x) => typeof x === 'string' && x.length) || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return json({ error: 'A headline, CTA, reference image and campaign settings are required.' }, { status: 400 });
    }
    if (image.length > 11_000_000) return json({ error: 'Reference image too large. Please use an image under about 8 MB.' }, { status: 413 });
    const aspect_ratio = ['1:1', '4:5', '9:16'].includes(ratio) ? ratio : '4:5';
    const prompt = `Create ONE finished Instagram advertising image for ${brand}. Target audience: ${audience}. Keep the same product as in the supplied reference photograph; preserve its shape, label and branding as accurately as possible. Brand colors: ${palette}. Art direction: retro editorial coffee advertising with warm natural sunlight, soft contrast, subtle film-grain texture, refined composition and a premium vintage-inspired aesthetic. Keep the mood calm, nostalgic and elevated. Use only warm cream (#EAE8DA) for designed backgrounds and dark green (#37412D) for accents, text and product framing. No sage, lighter greens or additional accent colours. Preserve the natural colours of coffee and the official product. Avoid bright colours, neon, modern gradients and overly glossy ad styling. Typography must be clean, elegant, slightly retro and highly readable. Layout and typography: ${layout}. Include this headline EXACTLY, including punctuation: "${headline}". Include this CTA EXACTLY: "${cta}". The CTA must appear as visible text INSIDE the final image. No extra marketing copy. Use consistent typography, spacing and styling across this controlled comparison. Produce a complete, legible ad, not a mockup of a website.`;
    const response = await fetch('https://openrouter.ai/api/v1/images', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'Creative Testing Lab' },
      body: JSON.stringify({ model: model || 'black-forest-labs/flux.2-klein-4b', prompt, aspect_ratio, n: 1, output_format: 'png', input_references: [{ type: 'image_url', image_url: { url: image } }] })
    });
    const payload = await response.json();
    if (!response.ok) return json({ error: payload?.error?.message ?? payload?.message ?? `OpenRouter error (${response.status})` }, { status: 502 });
    const result = payload?.data?.[0];
    if (!result?.b64_json) return json({ error: 'The provider did not return an image. Check that the model supports reference-image generation.' }, { status: 502 });
    return json({ image: `data:${result.media_type || 'image/png'};base64,${result.b64_json}`, cost: payload?.usage?.cost ?? null });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Image generation failed.' }, { status: 500 });
  }
};

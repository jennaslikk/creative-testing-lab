# Creative Testing Lab — SvelteKit starter

An editable SvelteKit app for the **The Afternoon Reset** school exercise.

## Open this in VS Code (Mac)

1. Unzip `creative-testing-lab.zip`.
2. In VS Code choose **File → Open Folder…** and select the **creative-testing-lab** folder.
3. Open **Terminal → New Terminal**.
4. Run:

   ```bash
   npm install
   npm run dev -- --open
   ```

5. Your browser will open the local app. To stop it, press **Control + C** in the terminal.

## Enable real AI generation

1. Create an API key with OpenRouter: https://openrouter.ai/settings/keys
2. Duplicate the `.env.example` file and rename it **`.env`**.
3. Replace `your_key_here` with your actual OpenRouter API key.
4. Restart the development server.
5. The three teacher reference images are already preloaded. Build the comparison and click **Generate** on one variant first.

**Security:** The key is read by `src/routes/api/generate/+server.ts` on the server. `.env` is ignored by Git. Never put the key into browser code or commit it.

**Cost:** OpenRouter generation may incur charges. Check model availability, reference-image compatibility, pricing and account balance before generating. Start with ONE variant.

## What's included

- Brand, audience and colors editing
- Editable headlines and CTAs
- All 3 official teacher reference images preloaded (and replaceable for the next campaign)
- Your 3 preferred editorial images displayed in an inspiration moodboard (not sent as the required AI references)
- Premium editorial art-direction instructions prefilled in the prompt
- Headline-only, CTA-only and 2×2 comparison constructors
- Up to 4 variants
- Server-side OpenRouter image API call with reference image and exact copy in prompt
- Loading/error messages, preview, retry and download
- Reset for the next campaign

## What remains for your assignment

- The official I1, I2 and I3 assets have already been added.
- Add an OpenRouter key and test a supported image model.
- Inspect generated headline/CTA spelling, packaging, readability and consistent layout.
- Collect feedback from another student group; revise as instructed.
- Check all behavior with the second input pack when your teacher provides it.

This is a starter project and has not been tested with a paid OpenRouter generation request. Results may vary by model.

## Helpful documentation

- SvelteKit: https://svelte.dev/docs/kit
- OpenRouter Image Generation: https://openrouter.ai/blog/tutorials/image-generation/

## What the reference images mean

- **Official input files**: `static/references/I1-product.png`, `I2-lifestyle.png`, `I3-experience.png`. These are the reference images actually sent to OpenRouter for each selected variant.
- **Editorial moodboard only**: `static/moodboard/mood-01.webp`, `mood-02.webp`, `mood-03.webp`. These are used to explain your preferred visual aesthetic, but are **not** sent to the image API. The prefilled design instructions describe that mood.
- For a controlled headline comparison, the source image, CTA, layout, prompt settings and model stay fixed. Generative image outputs may still vary; review the results by eye.

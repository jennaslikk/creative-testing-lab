<script lang="ts">
  type Reference = { id: string; name: string; image: string };
  type Variant = { id: string; headline: string; cta: string; reference: Reference; output?: string; error?: string; busy?: boolean; cost?: number | null };
  const startingHeadlines = ['Take a moment for yourself.', 'Cold brew, ready when you are.', 'Your afternoon deserves better.', 'Coffee without the wait.'];
  let headlines = $state([...startingHeadlines]);
  let ctas = $state(['Shop now', 'Discover the coffee', 'Learn more']);
  let references = $state<Reference[]>([{ id: 'I1', name: 'Studio product photograph', image: '/references/I1-product.png' }, { id: 'I2', name: 'Coffee beside a laptop', image: '/references/I2-lifestyle.png' }, { id: 'I3', name: 'Coffee poured over ice', image: '/references/I3-experience.png' }]);
  let brand = $state('The Afternoon Reset');
  let audience = $state('Working adults aged 25–45');
  let palette = $state('Dark green #37412D and warm cream #EAE8DA only. No sage, lighter greens or additional accent colours.');
  let layout = $state('Retro editorial coffee photography with warm natural sunlight, soft contrast, subtle analog film-grain texture, refined composition and a premium vintage-inspired aesthetic. Keep the mood calm, nostalgic and elevated, with warm cream #EAE8DA backgrounds and dark green #37412D text, accents and product framing. Use only these two colours for designed backgrounds and typography; no sage or lighter green. Preserve natural coffee and product colours. Avoid bright colours, neon, overly glossy styling and modern gradients. Preserve the official reference product, its branding and label accurately. Use clean, elegant, slightly retro typography with strong readability; place the headline in generous negative space near the top, the product as hero, and the exact CTA in a legible compact band near the bottom. Keep placement, crop, palette, typography and lighting consistent across variants, changing only the specified test variable. Do not add extra advertising copy or reproduce another brand logo or text.');
  let model = $state('black-forest-labs/flux.2-klein-4b');
  let ratio = $state('4:5');
  let mode = $state('headline');
  let selectedReference = $state('I1');
  let selectedHeadline = $state(0);
  let selectedCta = $state(0);
  let compareH = $state([0, 2]);
  let compareI = $state(['I1', 'I2']);
  let variants = $state<Variant[]>([]);
  let generating = $state(false);
  let notice = $state('');
  const referenceCategories = ['Product', 'Lifestyle', 'Experience'];
  const busy = $derived(generating || variants.some((v) => v.busy));
  function buildVariants() {
    if (busy) return;
    const ref = references.find((r) => r.id === selectedReference)!;
    let chosen: Variant[] = [];
    if (mode === 'headline') chosen = headlines.map((headline, i) => ({ id: `H${i + 1}`, headline, cta: ctas[selectedCta], reference: ref }));
    if (mode === 'cta') chosen = ctas.map((cta, i) => ({ id: `C${i + 1}`, headline: headlines[selectedHeadline], cta, reference: ref }));
    if (mode === 'matrix') {
      for (const h of compareH) for (const id of compareI) chosen.push({ id: `H${h + 1}-${id}`, headline: headlines[h], cta: ctas[selectedCta], reference: references.find((r) => r.id === id)! });
    }
    variants = chosen.slice(0, 4);
    notice = 'Your comparison is ready. Generate a single variation or the complete set below.';
    setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }
  async function handleUpload(event: Event, id: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)) { notice = 'Please choose a PNG, JPG or WebP image.'; return; }
    if (file.size > 8_000_000) { notice = 'Please use an image smaller than 8 MB.'; return; }
    const reader = new FileReader();
    reader.onload = () => { references = references.map((r) => r.id === id ? { ...r, image: String(reader.result) } : r); variants = []; notice = `${file.name} uploaded. Rebuild your comparison.`; };
    reader.readAsDataURL(file);
  }
  async function asDataUrl(source: string): Promise<string> {
    if (source.startsWith('data:image/')) return source;
    const response = await fetch(source);
    if (!response.ok) throw new Error('Could not load the chosen reference image.');
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Could not read the chosen reference image.'));
      reader.readAsDataURL(blob);
    });
  }
  async function generateOne(index: number) {
    const item = variants[index];
    if (!item.reference.image) { variants[index].error = `Upload ${item.reference.id} first.`; return; }
    variants[index].busy = true; variants[index].error = ''; variants[index].output = undefined;
    try {
      const image = await asDataUrl(item.reference.image);
      const response = await fetch('/api/generate', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ headline: item.headline, cta: item.cta, image, brand, audience, palette, layout, ratio, model }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong.');
      variants[index].output = data.image; variants[index].cost = data.cost;
    } catch(e) { variants[index].error = e instanceof Error ? e.message : 'Unknown error'; }
    finally { variants[index].busy = false; }
  }
  async function generateAll() {
    generating = true;
    for (let i = 0; i < variants.length; i++) await generateOne(i);
    generating = false;
  }
  function download(item: Variant) {
    if (!item.output) return;
    const a = document.createElement('a'); a.href = item.output; a.download = `${brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${item.id.toLowerCase()}.png`; a.click();
  }
  function toggleH(i: number) { compareH = compareH.includes(i) ? compareH.filter((x) => x !== i) : [...compareH, i].slice(-2); }
  function toggleI(id: string) { compareI = compareI.includes(id) ? compareI.filter((x) => x !== id) : [...compareI, id].slice(-2); }
  function clearForNewCampaign() {
    if (busy) return;
    if (!confirm('Replace current campaign content? Current images will be cleared.')) return;
    brand = ''; audience = ''; palette = ''; headlines = ['', '', '', '']; ctas = ['', '', '']; references = [{ id: 'I1', name: 'Reference 1', image: '' }, { id: 'I2', name: 'Reference 2', image: '' }, { id: 'I3', name: 'Reference 3', image: '' }]; variants = []; notice = 'Enter the next campaign details and upload the new reference images.';
  }
</script>
<svelte:head><title>Creative Testing Lab{brand ? ` · ${brand}` : ''}</title><meta name="description" content="AI-powered campaign image testing lab" /></svelte:head>
<div class="app-shell">
  <div class="announcement">Good ideas are made to be tested.</div>
  <nav class="top-nav" aria-label="Main navigation">
    <a class="brand-lockup" href="#top"><span class="brand-icon" aria-hidden="true">✳</span><span>Creative<br/>Testing Lab</span></a>
    <div class="nav-links"><a href="#campaigns">Campaigns</a><a class="button primary" href="#test-settings">Create a Test <span aria-hidden="true">↗</span></a></div>
  </nav>
  <main id="top">
    <header class="hero">
      <span class="eyebrow">A small studio for big possibilities</span>
      <h1>Creative<br/>Testing Lab<span class="hero-star" aria-hidden="true">✳</span></h1>
      <p class="hero-subtitle">Good ideas are made to be tested.</p>
      <p class="hero-description">A little curiosity. A few variations. A fresh perspective.<br/>Make, compare and find your next great campaign.</p>
      <a class="button primary" href="#campaigns">Start a campaign <span aria-hidden="true">↗</span></a>
      <div class="hero-foot"><span class="eyebrow">Made for curious minds</span><span aria-hidden="true">↓</span><span class="eyebrow">One idea. Many possibilities.</span></div>
    </header>
    <div class="workspace-heading" id="campaigns"><div><span class="eyebrow">01 / The starting point</span><h2>Your campaign, your way.</h2></div><span class="pill">● Draft campaign</span></div>
    <div class="content-grid">

      <section class="card details-card"><div class="section-heading"><span class="number">01</span><h2>Campaign details</h2></div><div class="field"><label for="brand">Client / brand</label><input id="brand" bind:value={brand}/></div><div class="field"><label for="audience">Target audience</label><input id="audience" bind:value={audience}/></div><div class="field"><label for="palette">Brand palette</label><input id="palette" bind:value={palette}/></div><button class="ghost tiny" onclick={clearForNewCampaign}>+ Start a different campaign</button></section>
      <section class="card assets-card"><div class="section-heading"><span class="number">02</span><h2>Creative assets</h2></div><div class="asset-columns"><div><p class="group-label">Headlines · exact copy</p>{#each headlines as headline, i}<div class="numbered-field"><span>H{i + 1}</span><input aria-label={`Headline ${i+1}`} bind:value={headlines[i]}/></div>{/each}</div><div><p class="group-label">Calls to action</p>{#each ctas as cta, i}<div class="numbered-field"><span>C{i + 1}</span><input aria-label={`CTA ${i+1}`} bind:value={ctas[i]}/></div>{/each}</div></div></section>
      <section class="card references-card"><div class="section-heading"><span class="number">03</span><h2>A different point of view.</h2></div><p class="section-intro">Three official campaign inputs. Choose your fixed image, or select two for an image comparison. Your original product stays at the heart of every variation.</p><div class="references">{#each references as reference, i}<article class="reference-tile" class:selected={mode === 'matrix' ? compareI.includes(reference.id) : selectedReference === reference.id}>
        <button class="reference-select" disabled={busy} aria-pressed={mode === 'matrix' ? compareI.includes(reference.id) : selectedReference === reference.id} onclick={() => { if (mode === 'matrix') toggleI(reference.id); else selectedReference = reference.id; }}>
          {#if reference.image}<img alt={reference.name} src={reference.image}/>{:else}<div class="image-placeholder"><span>✧</span><small>Upload your reference</small></div>{/if}
          <span class="reference-title"><span>{referenceCategories[i]}</span><span class="selection-mark">{(mode === 'matrix' ? compareI.includes(reference.id) : selectedReference === reference.id) ? '✓ Selected' : '+ Select'}</span></span>
        </button>
        <div class="reference-caption"><label for={`reference-name-${reference.id}`}>{reference.id} / Image description</label><input id={`reference-name-${reference.id}`} bind:value={references[i].name}/><label class="upload" for={`upload-${reference.id}`}>↥ {reference.image ? 'Replace reference' : 'Upload image'}</label><input class="file-input" id={`upload-${reference.id}`} type="file" disabled={busy} accept="image/png,image/jpeg,image/webp" onchange={(e)=>handleUpload(e, reference.id)}/></div>
      </article>{/each}</div></section>
      <section class="card moodboard-card"><div class="section-heading"><span class="number">✦</span><h2>Art direction / moodboard</h2></div><p class="muted tiny">Your three preferred editorial references are included as <strong>visual inspiration only</strong>, not as replacements for the required campaign input images. The default prompt reflects their mood without copying another brand.</p><div class="mood-grid"><div><img src="/moodboard/mood-01.webp" alt="Editorial close-up of coffee and sculptural ice"/><span>01 / Texture</span></div><div><img src="/moodboard/mood-02.webp" alt="Sunlit coffee being poured in an everyday scene"/><span>02 / Natural light</span></div><div><img src="/moodboard/mood-03.webp" alt="Close-up coffee photograph with deep tonal contrast"/><span>03 / Contrast</span></div></div><p class="muted tiny">Brand colours, supplied product and exact campaign copy remain fixed as requested in the assignment.</p></section>
      <section id="test-settings" class="card settings-card"><div class="section-heading"><span class="number">04</span><h2>Find your favourite.</h2></div><p class="section-intro">Change one thing. Learn something new. The controls below show what varies and what stays fixed.</p><p class="comparison-summary">{mode === 'headline' ? 'Comparing four headlines. Reference image and CTA stay fixed.' : mode === 'cta' ? 'Comparing three CTAs. Headline and reference image stay fixed.' : 'Comparing two headlines across two images. CTA stays fixed.'}</p><div class="field"><label for="mode">What would you like to compare?</label><select id="mode" bind:value={mode}><option value="headline">Four headlines (4 variants)</option><option value="cta">Three CTAs (3 variants)</option><option value="matrix">Two headlines × two images (4 variants)</option></select></div>{#if mode === 'matrix'}<div class="field"><p class="group-label">Pick exactly two headlines</p><div class="chips">{#each headlines as h,i}<button class:chosen={compareH.includes(i)} class="chip" aria-pressed={compareH.includes(i)} onclick={()=>toggleH(i)}>H{i+1}</button>{/each}</div></div><div class="field"><p class="group-label">Pick exactly two images</p><div class="chips">{#each references as r}<button class:chosen={compareI.includes(r.id)} class="chip" aria-pressed={compareI.includes(r.id)} onclick={()=>toggleI(r.id)}>{r.id}</button>{/each}</div></div>{:else}<div class="field"><label for="reference">Fixed reference image</label><select id="reference" bind:value={selectedReference}>{#each references as r}<option value={r.id}>{r.id} — {r.name}</option>{/each}</select></div>{/if}{#if mode !== 'cta'}<div class="field"><label for="cta">Fixed CTA</label><select id="cta" bind:value={selectedCta}>{#each ctas as c,i}<option value={i}>{c}</option>{/each}</select></div>{/if}{#if mode === 'cta'}<div class="field"><label for="headline">Fixed headline</label><select id="headline" bind:value={selectedHeadline}>{#each headlines as h,i}<option value={i}>{h}</option>{/each}</select></div>{/if}<div class="two-columns"><div class="field"><label for="ratio">Output ratio</label><select id="ratio" bind:value={ratio}><option value="4:5">4:5 · Instagram feed</option><option value="1:1">1:1 · Square</option><option value="9:16">9:16 · Story</option></select></div><div class="field"><label for="model">AI model</label><select id="model" bind:value={model}><option value="black-forest-labs/flux.2-klein-4b">FLUX.2 Klein 4B</option><option value="google/gemini-3.1-flash-lite-image">Gemini 3.1 Flash Lite Image</option><option value="meta/muse-image">Meta Muse Image</option></select></div></div><div class="field"><label for="layout">Design / layout instructions</label><textarea id="layout" rows="4" bind:value={layout}></textarea></div><button class="primary" onclick={buildVariants} disabled={busy || (mode === 'matrix' && (compareH.length !== 2 || compareI.length !== 2))}>Build comparison →</button></section>
    </div>
    <section class="results" id="results" aria-busy={busy}><div class="results-header"><div><span class="eyebrow">02 / The possibilities</span><h2>A fresh set of ideas.<span class="result-count">{variants.length} / 4</span></h2><p class="muted tiny">Your generated advertisements will appear here. Review text and visual consistency before saving.</p></div>{#if variants.length}<button class="primary" onclick={generateAll} disabled={generating || variants.some((v)=>!v.reference.image)}>{generating ? 'Generating images…' : '✦ Generate all variants'}</button>{/if}</div>{#if notice}<p class="notice" role="status">{notice}</p>{/if}{#if variants.length === 0}<div class="empty-results"><span>✳</span><h3>Your next idea starts here.</h3><p>Choose a comparison above to see up to four proposed variations.</p></div>{:else}<div class="result-grid">{#each variants as variant,i}<article class="result-card"><div class="result-preview" class:portrait={ratio === '9:16'} class:square={ratio === '1:1'}>{#if variant.output}<img alt={`Generated campaign ${variant.id}`} src={variant.output}/>{:else if variant.busy}<div class="image-placeholder"><div class="spinner"></div><span role="status">Generating {variant.id}…</span></div>{:else}<div class="image-placeholder"><span>✧</span><small>IMAGE PREVIEW</small></div>{/if}</div><div class="result-info"><div><span class="pill">Variant {variant.id}</span><h3>{variant.headline}</h3><p>{variant.reference.id} · {variant.cta}</p></div>{#if variant.error}<p class="error" role="alert">{variant.error}</p>{/if}{#if variant.cost != null}<p class="muted tiny">Reported cost: ${variant.cost.toFixed(4)}</p>{/if}<div class="result-actions"><button class="secondary" onclick={()=>generateOne(i)} disabled={generating || variant.busy || !variant.reference.image}>{variant.output ? '↻ Retry' : '✦ Generate'}</button><button class="ghost" onclick={()=>download(variant)} disabled={!variant.output}>↓ Download</button></div></div></article>{/each}</div>{/if}</section>
    <footer><span>© CREATIVE TESTING LAB</span><span>{brand || 'YOUR NEXT CAMPAIGN'} / MADE WITH CURIOSITY</span></footer>
  </main>
</div>

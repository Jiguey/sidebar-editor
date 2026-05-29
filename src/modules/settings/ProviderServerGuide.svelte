<script lang="ts">
  import CopyableSnippet from "$lib/components/CopyableSnippet.svelte";
  import {
    OLLAMA_API_DOCS,
    LLAMACPP_FLAG_DOCS,
    DEFAULT_OLLAMA_SERVER_TEMPLATE,
    DEFAULT_LLAMACPP_SERVER_TEMPLATE,
    buildOllamaApplyCommands,
    buildOllamaRestartOneLiner,
    buildOllamaApiTestCurl,
    buildOllamaModelfileCommand,
    buildOllamaOverrideConf,
    buildLlamacppApplyCommands,
    buildLlamacppRestartOneLiner,
    buildLlamacppServiceUnit,
    buildLlamacppContextChangeCommand,
    buildLlamacppExecStart,
    buildLlamacppModelChangeCommand,
    buildLlamacppOneShotCommand,
    type LlamacppServerTemplate,
    type OllamaServerTemplate,
  } from "$lib/providerServerConfig";

  let {
    kind,
    ollamaTemplate = $bindable(),
    llamacppTemplate = $bindable(),
    ollamaEndpoint = "",
    selectedModel = "",
    ollamaContext = 8192,
    llamacppContext = 8192,
  }: {
    kind: "ollama" | "llamacpp";
    ollamaTemplate?: OllamaServerTemplate;
    llamacppTemplate?: LlamacppServerTemplate;
    ollamaEndpoint?: string;
    selectedModel?: string;
    ollamaContext?: number;
    llamacppContext?: number;
  } = $props();

  let ollamaTpl = $derived(ollamaTemplate ?? DEFAULT_OLLAMA_SERVER_TEMPLATE);
  let llamacppTpl = $derived(llamacppTemplate ?? DEFAULT_LLAMACPP_SERVER_TEMPLATE);

  let ollamaOverride = $derived(buildOllamaOverrideConf(ollamaTpl));
  let ollamaRestart = $derived(buildOllamaRestartOneLiner());
  let ollamaApply = $derived(buildOllamaApplyCommands());
  let ollamaModelfile = $derived(
    selectedModel
      ? buildOllamaModelfileCommand(selectedModel, ollamaContext, ollamaTpl.numThreads)
      : ""
  );
  let ollamaCurl = $derived(
    selectedModel
      ? buildOllamaApiTestCurl(ollamaEndpoint, selectedModel, ollamaContext, ollamaTpl.numThreads)
      : ""
  );

  let llamacppExec = $derived(buildLlamacppExecStart(llamacppTpl));
  let llamacppUnit = $derived(buildLlamacppServiceUnit(llamacppTpl));
  let llamacppRestart = $derived(buildLlamacppRestartOneLiner(llamacppTpl));
  let llamacppApply = $derived(buildLlamacppApplyCommands(llamacppTpl));
  let llamacppOneShot = $derived(buildLlamacppOneShotCommand(llamacppTpl));
  let llamacppContextCmd = $derived(
    buildLlamacppContextChangeCommand(llamacppTpl, llamacppContext)
  );
  let llamacppModelCmd = $derived(
    buildLlamacppModelChangeCommand(llamacppTpl, llamacppTpl.modelPath)
  );
</script>

<section class="server-guide">
  <h4 class="guide-title">Server config (terminal)</h4>
  <p class="note muted">
    Settings above marked <strong>via API</strong> apply on the next chat message. Server blocks below
    are copy-paste snippets for <code class="inline-code">systemctl</code> — requires sudo.
  </p>

  {#if kind === "ollama" && ollamaTemplate}
    <p class="group-label">Via API (Tiny Llama controls these)</p>
    <div class="api-table-wrap">
      <table class="api-table">
        <thead>
          <tr><th>Setting</th><th>Where</th><th>Notes</th></tr>
        </thead>
        <tbody>
          {#each OLLAMA_API_DOCS as row}
            <tr>
              <td>{row.name}</td>
              <td>{row.via}</td>
              <td>{row.notes}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <p class="group-label">Server template (generates override.conf)</p>
    <div class="template-grid">
      <label class="field"><span class="name">Models path</span><input class="input" bind:value={ollamaTemplate.modelsPath} /></label>
      <label class="field"><span class="name">Default context cap</span><input class="input" type="number" bind:value={ollamaTemplate.contextLength} /></label>
      <label class="field"><span class="name">Threads</span><input class="input" type="number" bind:value={ollamaTemplate.numThreads} /></label>
      <label class="field"><span class="name">Keep alive (-1 = forever)</span><input class="input" type="number" bind:value={ollamaTemplate.keepAlive} /></label>
      <label class="field field-row">
        <input type="checkbox" class="checkbox" bind:checked={ollamaTemplate.newEngine} />
        <span class="name">New engine (off for Vega)</span>
      </label>
      <label class="field field-row">
        <input type="checkbox" class="checkbox" bind:checked={ollamaTemplate.flashAttention} />
        <span class="name">Flash attention (off for Vega)</span>
      </label>
      <label class="field field-row">
        <input type="checkbox" class="checkbox" bind:checked={ollamaTemplate.useHsaOverride} />
        <span class="name">HSA override (usually off on Vega)</span>
      </label>
      {#if ollamaTemplate.useHsaOverride}
        <label class="field"><span class="name">HSA version</span><input class="input" bind:value={ollamaTemplate.hsaOverrideVersion} /></label>
      {/if}
    </div>

    <CopyableSnippet label="override.conf → /etc/systemd/system/ollama.service.d/" text={ollamaOverride} />
    <CopyableSnippet label="After saving override — run in terminal" text={ollamaRestart} />
    <CopyableSnippet label="Full apply workflow" text={ollamaApply} />
    {#if ollamaModelfile}
      <CopyableSnippet label="Create custom model variant (optional)" text={ollamaModelfile} />
    {/if}
    {#if ollamaCurl}
      <CopyableSnippet label="Test API (curl)" text={ollamaCurl} />
    {/if}
  {:else if kind === "llamacpp" && llamacppTemplate}
    <p class="group-label">Via API (Tiny Llama)</p>
    <p class="note muted">Model id and endpoint only. Context for llama.cpp is set at server launch (<code class="inline-code">-c</code>).</p>

    <p class="group-label">llama-server flags (your working setup)</p>
    <div class="api-table-wrap">
      <table class="api-table">
        <thead>
          <tr><th>Flag</th><th>Meaning</th><th>Restart?</th></tr>
        </thead>
        <tbody>
          {#each LLAMACPP_FLAG_DOCS as row}
            <tr>
              <td><code class="inline-code">{row.flag}</code></td>
              <td>{row.meaning}</td>
              <td>{row.restart === "server" ? "service" : "no"}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <p class="group-label">Server template (generates systemd unit)</p>
    <div class="template-grid">
      <label class="field"><span class="name">Service name</span><input class="input" bind:value={llamacppTemplate.serviceName} /></label>
      <label class="field"><span class="name">Model (.gguf path)</span><input class="input" bind:value={llamacppTemplate.modelPath} /></label>
      <label class="field"><span class="name">Host</span><input class="input" bind:value={llamacppTemplate.host} /></label>
      <label class="field"><span class="name">Port</span><input class="input" type="number" bind:value={llamacppTemplate.port} /></label>
      <label class="field"><span class="name">Context (-c)</span><input class="input" type="number" bind:value={llamacppTemplate.context} /></label>
      <label class="field"><span class="name">GPU layers (-ngl)</span><input class="input" type="number" bind:value={llamacppTemplate.ngl} /></label>
      <label class="field"><span class="name">Threads (-t)</span><input class="input" type="number" bind:value={llamacppTemplate.threads} /></label>
      <label class="field"><span class="name">Batch threads (-tb)</span><input class="input" type="number" bind:value={llamacppTemplate.threadsBatch} /></label>
      <label class="field"><span class="name">User</span><input class="input" bind:value={llamacppTemplate.user} /></label>
      <label class="field field-row"><input type="checkbox" class="checkbox" bind:checked={llamacppTemplate.jinja} /><span class="name">--jinja</span></label>
      <label class="field field-row"><input type="checkbox" class="checkbox" bind:checked={llamacppTemplate.flashAttn} /><span class="name">--flash-attn on</span></label>
      <label class="field field-row"><input type="checkbox" class="checkbox" bind:checked={llamacppTemplate.mlock} /><span class="name">--mlock</span></label>
    </div>

    <CopyableSnippet label="ExecStart line" text={llamacppExec} />
    <CopyableSnippet label="Full systemd unit (reference)" text={llamacppUnit} />
    <CopyableSnippet label="After saving unit — run in terminal" text={llamacppRestart} />
    <CopyableSnippet label="Full apply workflow" text={llamacppApply} />
    <CopyableSnippet label="One-shot (no systemd)" text={llamacppOneShot} />
    <CopyableSnippet label="Change context only" text={llamacppContextCmd} />
    <CopyableSnippet label="Change model path only" text={llamacppModelCmd} />
  {/if}
</section>

<style>
  .server-guide {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
  }

  .guide-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
  }

  .api-table-wrap {
    overflow-x: auto;
  }

  .api-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .api-table th,
  .api-table td {
    border: 1px solid var(--border);
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }

  .api-table th {
    background: var(--muted);
    font-weight: 600;
  }
</style>

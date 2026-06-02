<script lang="ts">
  import { onMount } from "svelte";
  import "./DevViteReconnect.css";

  let disconnected = $state(false);

  onMount(() => {
    if (!import.meta.env.DEV) return;

    const hot = import.meta.hot;
    if (!hot) return;

    const onDisconnect = () => {
      disconnected = true;
    };
    const onConnect = () => {
      disconnected = false;
    };

    hot.on("vite:ws:disconnect", onDisconnect);
    hot.on("vite:ws:connect", onConnect);

    return () => {
      hot.off("vite:ws:disconnect", onDisconnect);
      hot.off("vite:ws:connect", onConnect);
    };
  });

  function reload() {
    window.location.reload();
  }
</script>

{#if disconnected}
  <div class="dev-vite-reconnect" role="alert">
    <p>Lost connection to the dev server. The webview may look blank until you reload.</p>
    <button type="button" class="dev-vite-reconnect__btn" onclick={reload}>Reload app</button>
  </div>
{/if}

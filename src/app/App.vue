<script setup lang="ts">
import { useShortcuts } from '@/composables/useShortcuts';
import ShortcutSettingsPanel from '@/editor/settings/ShortcutSettingsPanel.vue';

/** 在應用程式最外層啟動全域鍵盤快捷鍵監聽（如 Ctrl+Z / Ctrl+Y） */
useShortcuts();
</script>

<template>
    <UApp>
        <RouterView />
        <ShortcutSettingsPanel />
    </UApp>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/nav/NavBar.vue'
</script>

<template>
  <div class="flex flex-col h-full justify-stretch">
    <div class="overflow-auto flex-1 flex flex-col">
      <RouterView v-slot="{ Component }">
        <template v-if="Component">
          <KeepAlive include="PlantsOverviewLoader">
              <component :is="Component" />
          </KeepAlive>
        </template>
      </RouterView>
    </div>
    <NavBar class=""></NavBar>
  </div>
</template>

<style scoped></style>

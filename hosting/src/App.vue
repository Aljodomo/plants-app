<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from "@/components/nav/NavBar.vue";
</script>

<template>
  <v-layout class="">
    <v-main>
    <RouterView v-slot="{ Component }">
      <template v-if="Component">
        <KeepAlive include="PlantsOverviewLoader">
          <component :is="Component" />
        </KeepAlive>
      </template>
    </RouterView>
    </v-main>
    <NavBar></NavBar>
  </v-layout>
</template>

<style scoped></style>

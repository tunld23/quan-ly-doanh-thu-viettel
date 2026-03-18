<script setup>
import { useTargets } from "../composables/useTargets";
import TargetForm from "../components/targets/TargetForm.vue";
import TargetList from "../components/targets/TargetList.vue";

const {
  form,
  loading,
  submitting,
  years,
  productGroups,
  listTypeFilter,
  listYearFilter,
  listGroupFilter,
  uniqueGroupsInList,
  filteredTargets,
  submitTarget,
  deleteTarget,
} = useTargets();
</script>

<template>
  <div class="target-config-container p-6">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 uppercase tracking-tight">
        Quản lý Chỉ tiêu
      </h1>

      <!-- INPUT FORM -->
      <TargetForm
        :form="form"
        :years="years"
        :product-groups="productGroups"
        :submitting="submitting"
        @submit="submitTarget"
      />

      <!-- LIST VIEW -->
      <TargetList
        v-model:listTypeFilter="listTypeFilter"
        v-model:listYearFilter="listYearFilter"
        v-model:listGroupFilter="listGroupFilter"
        :filtered-targets="filteredTargets"
        :years="years"
        :unique-groups-In-list="uniqueGroupsInList"
        :loading="loading"
        @delete="deleteTarget"
      />
    </div>
  </div>
</template>

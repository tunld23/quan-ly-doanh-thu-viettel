<script setup>
import { useTargets } from "../composables/useTargets";
import TargetForm from "../components/targets/TargetForm.vue";
import TargetList from "../components/targets/TargetList.vue";

const {
  form,
  loading,
  submitting,
  years,
  allTargets,
  listYearFilter,
  listMonthFilter,
  submitTarget,
  deleteTarget,
} = useTargets();
</script>

<template>
  <div class="target-config-container p-6">
    <div class="max-w-3xl mx-auto">
      <h1
        class="text-3xl lg:text-[40px] font-black text-[#1b254b] tracking-tight leading-none mb-6 drop-shadow-sm"
      >
        Quản lý Chỉ tiêu
      </h1>

      <!-- INPUT FORM -->
      <TargetForm
        :form="form"
        :years="years"
        :submitting="submitting"
        @submit="submitTarget"
      />

      <!-- LIST VIEW -->
      <TargetList
        v-model:listYearFilter="listYearFilter"
        v-model:listMonthFilter="listMonthFilter"
        :all-targets="allTargets"
        :years="years"
        :loading="loading"
        @delete="deleteTarget"
      />
    </div>
  </div>
</template>

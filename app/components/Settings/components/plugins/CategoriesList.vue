// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <WrapLayout orientation="horizontal" class="categories">
    <StackLayout
      v-for="(category, key) in categories"
      :key="key"
      class="chip"
      :class="{ 'chip--active': activeCategory === category.name }"
      v-on="pressFeedback"
      @tap="onCategoryTap(category.name)"
    >
      <Label :text="getCategoryText(category)" class="chip-text" />
    </StackLayout>
  </WrapLayout>
</template>

<script>
import { pressFeedback } from '@/utils/platform/ui';

export default {
  name: 'CategoriesList',

  props: {
    categories: {
      type: Object,
      required: true,
    },
    activeCategory: {
      type: String,
      required: true,
    },
  },

  data() {
    return { pressFeedback };
  },

  methods: {
    // Get category text with optional new indicator symbol
    getCategoryText(category) {
      return category.name + (category.hasNew ? '  ●' : '');
    },

    // Emit category selection event to parent
    onCategoryTap(categoryName) {
      this.$emit('categorySelected', categoryName);
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.categories {
  padding: $spacing-s 0;
}
</style>

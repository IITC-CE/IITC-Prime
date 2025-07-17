// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <WrapLayout orientation="horizontal" class="categories">
    <Label
      v-for="(category, key) in categories"
      :key="key"
      :text="getCategoryText(category)"
      class="category-tag"
      :class="{ active: activeCategory === category.name, 'has-new': category.hasNew }"
      @tap="onCategoryTap(category.name)"
    />
  </WrapLayout>
</template>

<script>
export default {
  name: 'CategoriesList',

  props: {
    categories: {
      type: Object,
      required: true
    },
    activeCategory: {
      type: String,
      required: true
    }
  },

  methods: {
    // Get category text with optional new indicator symbol
    getCategoryText(category) {
      return category.name + (category.hasNew ? '  ●' : '');
    },

    // Emit category selection event to parent
    onCategoryTap(categoryName) {
      this.$emit('categorySelected', categoryName);
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/app';

.categories {
  padding: 4 4;
}

.category-tag {
  margin: 2;
  padding: 6 12;
  border-radius: 16;
  background-color: $surface-variant;
  border-width: 1;
  border-color: $surface-variant;
  color: $on-surface;
  font-size: $font-size-small;
  text-align: center;
}

.category-tag.active {
  background-color: $primary-light;
  border-color: $primary;
  color: $on-primary;
  font-weight: bold;
}
</style>

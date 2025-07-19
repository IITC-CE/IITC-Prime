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
  padding: $spacing-s 0;
}

.category-tag {
  margin: $spacing-xxs;
  padding: 6 12;
  border-radius: $radius-large;
  background-color: $surface-bright;
  color: $on-surface;
  font-size: $font-size-small;
  text-align: center;
}

.category-tag.active {
  background-color: $primary-light;
  color: $on-primary;
  font-weight: bold;
}
</style>

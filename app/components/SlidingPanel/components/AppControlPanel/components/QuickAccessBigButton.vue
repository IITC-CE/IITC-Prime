//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout
    flexDirection="column"
    alignItems="center"
    class="btn"
    :class="{ 'active': active }"
    @tap="handleTap($event)"
  >
    <Label class="fa icon" :class="{ 'active-icon': active }" :text="icon | fonticon" />
    <Label class="text" :class="{ 'active-text': active }" :text="name" />
  </FlexboxLayout>
</template>

<script>
  export default {
    props: {
      icon: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      active: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        hover: false
      }
    },
    methods: {
      handleTap: function (event) {
        this.$emit('tap', event);
      },
    }
  }
</script>

<style scoped lang="scss">
  @import '@/app';

  .btn {
    font-size: $font-size;
    text-align: center;
    padding: 0 $spacing-s;

    &.active {
      opacity: 0.9;
    }
  }

  .icon {
    margin: 0 0 $spacing-xs 0;
    width: 54;
    height: 54;
    font-size: $font-size-headline;
    border-radius: $radius-large;
    color: $on-primary;
    background-color: $surface-bright;
    box-shadow: 0 2 4 rgba(0, 0, 0, 0.05);

    &.active-icon {
      background-color: $primary;
      color: $on-primary;
    }
  }

  .text {
    &.active-text {
      color: $primary;
      font-weight: bold;
    }
  }
</style>

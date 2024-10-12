//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <MDButton variant="flat" rippleColor="#ffffff" class="fa icon" :text="icon | fonticon" @tap="$emit('tap')" />
</template>

<script>
  export default {
    props: {
      icon: {
        type: String,
        required: true
      }
    }
  }
</script>

<style scoped lang="scss">
  .icon {
    width: 46;
    min-width: 46;
    max-width: 46;
    height: 46;
    font-size: 20;
    padding-top: 12;
    color: rgba(255, 255, 255, 0.7);
    background-color: rgba(0, 0, 0, 0);
    text-align:center;
  }
</style>

//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout flexDirection="column" alignItems="center" class="btn" @touch="hoverOver($event)">
    <Label class="fa icon" :text="icon | fonticon" />
    <Label class="text" :text="name" />
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
      }
    },
    data() {
      return {
        hover: false
      }
    },
    methods: {
      hoverOver: function (e) {
        if (e.action === "down") {
          this.hover = true;
        } else if (e.action === "up") {
          this.hover = false;
        }
      },
    }
  }
</script>

<style scoped lang="scss">
  @import '@/app';

  .btn {
    font-size: $font-size;
    text-align: center;
    padding: 0 10;
  }

  .icon {
    margin: 0 0 2 0;
    width: 54;
    height: 54;
    font-size: 20;
    border-radius: 50%;
    color: $text-bottom-sheet;
    background-color: $complementary-bottom-sheet;
  }
</style>

//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout flexDirection="column" class="btn" @touch="hoverOver($event)">
    <Label class="fa icon" :text="icon | fonticon" />
    <Label :text="name" />
  </FlexboxLayout>
</template>

<script>
  import { Label } from "@nativescript/core";

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
  @import '../app';

  .btn {
    font-size: $font-size;
    text-align: center;
    padding: 14;
  }

  .icon {
    margin: 0 13 2 13;
    padding: 16 0;
    font-size: 18;
    text-align: center;
    border-radius: 50%;
    color: $text-bottom-sheet;
    background-color: $complementary-bottom-sheet;
  }
</style>

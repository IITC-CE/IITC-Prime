//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <AbsoluteLayout class="btn" @touch="hoverOver($event)" @tap="$emit('tap')">
    <label :class="{'background': true, 'background-active': hover }"></label>
    <StackLayout class="icon-wrapper">
      <Label class="fa icon" :text="icon | fonticon" />
    </StackLayout>
  </AbsoluteLayout>
</template>

<script>
  import { Label } from "@nativescript/core";

  export default {
    props: {
      icon: {
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
  @keyframes background-animation {
    from {
      opacity: 0;
    }
    to {
      opacity: 0.15;
    }
  }

  .background {
    left: 0;
    top: 0;
    width: 46;
    height: 46;
    border-radius: 7;
    opacity: 0;
    background: rgba(255, 255, 255, 0.36);

    animation-name: background-animation;
    animation-duration: 0.1s;
    animation-fill-mode: forwards;
    animation-direction: reverse;
  }

  .background-active {
    animation-name: background-animation;
    animation-duration: 0.1s;
    animation-fill-mode: forwards;
  }

  .btn {
    height: 46;
    min-width: 46;
    max-width: 46;
    color: rgba(255, 255, 255, 0.7);
  }

  .icon-wrapper {
    top: 0;
    left: 0;
    width: 46;
    height: 46;
    vertical-alignment: center;
    horizontal-alignment: center;
  }

  .fa.icon {
    top: 0;
    left: 0;
    width: 46;
    height: 46;
    font-size: 21;
    padding-top: 12;
    text-align:center;
  }
</style>

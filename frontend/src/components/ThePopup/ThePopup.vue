<template>
    <Teleport to="body">
        <div @click="clickBackground" v-if="popup.open" class="pupup-background"></div>

        <transition name="modal">
            <div @click="clickBackground" v-if="popup.open" class="pupup">
                <div class="center">

                    <div class="popup-content">

                        <div v-if="popup.icon == 'error'" class="swal2-icon swal2-error swal2-icon-show"
                            style="display: flex;">
                            <span class="swal2-x-mark">
                                <span class="swal2-x-mark-line-left"></span>
                                <span class="swal2-x-mark-line-right"></span>
                            </span>
                        </div>

                        <div v-if="popup.icon == 'success'" class="swal2-icon swal2-success swal2-icon-show"
                            style="display: flex;">
                            <div class="swal2-success-circular-line-left" style="background-color: rgb(255, 255, 255);">
                            </div>
                            <span class="swal2-success-line-tip"></span> <span class="swal2-success-line-long"></span>
                            <div class="swal2-success-ring"></div>
                            <div class="swal2-success-fix" style="background-color: rgb(255, 255, 255);"></div>
                            <div class="swal2-success-circular-line-right"
                                style="background-color: rgb(255, 255, 255);"></div>
                        </div>

                        <div v-if="popup.icon == 'warning'" class="swal2-icon swal2-warning swal2-icon-show"
                            style="display: flex;">
                            <div class="swal2-icon-content">!</div>
                        </div>

                        <h2 class="title" v-if="popup.title">{{ popup.title }}</h2>
                        <p class="text" v-if="popup.text">{{ popup.text }}</p>

                        <div class="buttons">
                            <button @click="popup.answer(true)" :style="{'background-color': popup.confirmButtonColor}"
                                class="button" v-if="popup.confirmButtonText">{{
                                popup.confirmButtonText }}</button>

                            <button @click="popup.answer(undefined)"
                                :style="{'background-color': popup.cancelButtonColor}" class="button"
                                v-if="popup.showCancelButton">{{
                                popup.cancelButtonText }}</button>


                        </div>

                    </div>

                </div>
            </div>
        </transition>

    </Teleport>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    import { usePopupStore } from './popup.store.js'
    const popup = usePopupStore()

    function clickBackground(e) {
        if (e.target.classList.contains('pupup-background')) {
            popup.close()
        }
    }
</script>

<style scoped>
    @import "./sweetalert2.min.css";

    .buttons {
        display: flex;
        flex-direction: row;
        gap: 0.8rem;
    }

    .icon {
        margin-bottom: 2rem;
    }

    .title {
        font-size: 1.8rem;
        margin-bottom: 1rem;
    }

    .text {
        font-size: 1.1rem;
        margin-bottom: 2rem;
        text-align: center;
    }

    .button {
        min-height: 40px;
        color: white;
        border-radius: 0.25rem;
        padding: 0.625em 1.1em;
    }

    .button:focus,
    .button:hover {
        border: none;
        outline: none;
        box-shadow: 0 0 0 3px rgba(112, 102, 224, .5);
    }

    .button:active {
        background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2));
    }

    .pupup-background {
        background: rgba(0, 0, 0, .4);
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
    }

    .pupup {
        padding: 1rem;
        position: fixed;
        height: 100%;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        overflow: auto;
        color: rgb(84, 84, 84);
    }

    .pupup::-webkit-scrollbar {
        width: 0;
    }

    .center {
        display: flex;
        flex-direction: row;
        /* justify-content: center; */
        align-items: center;

        min-height: 100%;
    }

    .popup-content {
        flex-grow: 1;
        max-width: 32rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        border-radius: 5px;
        margin: 0 auto;
        background-color: white;
        padding: 2rem 1rem;
    }

    .modal-enter-active {
        animation: popup-show 0.3s;
    }

    @keyframes popup-show {
        0% {
            transform: scale(0.7);
        }

        45% {
            transform: scale(1.05);
        }

        80% {
            transform: scale(0.95);
        }

        100% {
            transform: scale(1);
        }
    }
</style>
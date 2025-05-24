<template>
    <div class="modal" :id="props.id">
        <div class="modal__bg" @click="closeModal(`#${props.id}`)"></div>
        <div class="modal__content">
            <img :src="url" alt="something" class="modal__img" />
            <div class="btn close" @click="closeModal(`#${props.id}`)">Закрыть</div>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    id: { type: String, required: true },
    url: { type: String, required: true },
});

function closeModal(id) {
    //   Popup Style
    let modal = document.querySelector(id);
    let bg = modal.querySelector(".modal__bg");
    let content = modal.querySelector(".modal__content");

    bg.style.opacity = "0";
    content.style.opacity = "0";
    content.style.transform = "scale(0.8)";

    setTimeout(() => {
        modal.style.display = "none";
    }, 700);
}
</script>

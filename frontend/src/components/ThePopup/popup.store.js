import { watch } from 'vue'
import { defineStore } from 'pinia'

export const usePopupStore = defineStore('popup', {
    state: () => {
        return {
            open: false,
            icon: null,
            title: null,
            text: null,
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            showCancelButton: false,
            confirmButtonColor: '#7066e0',
            cancelButtonColor: "red",
            value: null
        }
    },
    actions: {
        fire(obj, text, icon) {
            this.$reset();

            if (typeof obj == 'object') {
                const condition = (property) => {
                    if (obj.hasOwnProperty(property)) {
                        this[property] = obj[property];
                    }
                }

                condition('icon')
                condition('title')
                condition('text')
                condition('confirmButtonText')
                condition('showCancelButton')
                condition('confirmButtonColor')
                condition('cancelButtonColor')
            } else {
                let title = obj;

                const condition = (key, value) => {
                    if (value) {
                        this[key] = value;
                    }
                }

                condition('title', title)
                condition('text', text)
                condition('icon', icon)
            }

            this.open = true;

            return new Promise((resolve) => {
                const stop = watch(() => this.value, () => {
                    stop();

                    resolve({
                        value: this.value
                    })
                }, { immediate: false })
            });
        },
        answer(value) {
            this.value = value;
            this.open = false;
        }
    },
})
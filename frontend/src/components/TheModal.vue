<template>
    <div class="modal" :id="props.id">
        <div class="modal__bg" @click="closeModal(`#${props.id}`)"></div>
        <div class="modal__content">
            <div class="modal__simple">
                <h2>Добавить достижение</h2>

                <form @submit.prevent="addData()">
                    <div class="login__item">
                        <v-autocomplete style="width: 100%" v-model="name" label="Выберите предметную область"
                            variant="underlined"
                            :items="store.getPropertiesArray('subjectAreas', 'subject')"></v-autocomplete>
                    </div>

                    <div class="login__item">
                        <v-autocomplete style="width: 100%" label="Уровень олимпиады/конкурса" v-model="level"
                            variant="underlined" :disabled="name == '' || isCertificateSubject"
                            :items="store.getPropertiesArray('competitionLevel', 'name')"></v-autocomplete>
                    </div>

                    <div class="login__item">
                        <v-autocomplete style="width: 100%" label="Статус участника достижения" v-model="status"
                            variant="underlined" :disabled="name == '' || isCertificateSubject"
                            :items="store.getPropertiesArray('status', 'name')"></v-autocomplete>
                    </div>

                    <div class="modal__group">
                        <template v-for="direction in store.getSuitableDirections">
                            <div class="login__item" v-if="balls_result[direction.id] !== 0">
                                <h4>{{ direction.name }}</h4>
                                <span>
                                    <input type="text" name="rating_prog" :value="balls_result[direction.id]"
                                        disabled />
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                        fill="none">
                                        <path
                                            d="M15 16L11 20H21V16H15ZM12.06 7.19002L3 16.25V20H6.75L15.81 10.94L12.06 7.19002ZM5.92 18H5V17.08L12.06 10L13 10.94L5.92 18ZM18.71 8.04002C19.1 7.65002 19.1 7.00002 18.71 6.63002L16.37 4.29002C16.1825 4.10401 15.9291 3.99963 15.665 3.99963C15.4009 3.99963 15.1475 4.10401 14.96 4.29002L13.13 6.12002L16.88 9.87002L18.71 8.04002Z"
                                            fill="#1967D2" />
                                    </svg>
                                </span>
                            </div>
                        </template>
                    </div>

                    <div class="login__item">
                        <h4>
                            Загрузить файл
                            <b>(макс 2мб)</b>
                        </h4>
                        <span @click="updateImg">
                            <input type="file" id="file" accept="image/png, image/gif, image/jpeg, application/pdf" required />
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25"
                                fill="none">
                                <path
                                    d="M12.3117 22.5C10.7784 22.5 9.47837 21.9667 8.41171 20.9C7.34504 19.8333 6.81171 18.5333 6.81171 17V6.5C6.81171 5.4 7.20337 4.45833 7.98671 3.675C8.77004 2.89167 9.71171 2.5 10.8117 2.5C11.9117 2.5 12.8534 2.89167 13.6367 3.675C14.42 4.45833 14.8117 5.4 14.8117 6.5V16C14.8117 16.7 14.57 17.2917 14.0867 17.775C13.6034 18.2583 13.0117 18.5 12.3117 18.5C11.6117 18.5 11.02 18.2583 10.5367 17.775C10.0534 17.2917 9.81171 16.7 9.81171 16V6.5H11.3117V16C11.3117 16.2833 11.4077 16.5207 11.5997 16.712C11.791 16.904 12.0284 17 12.3117 17C12.595 17 12.8327 16.904 13.0247 16.712C13.216 16.5207 13.3117 16.2833 13.3117 16V6.5C13.3117 5.8 13.07 5.20833 12.5867 4.725C12.1034 4.24167 11.5117 4 10.8117 4C10.1117 4 9.52004 4.24167 9.03671 4.725C8.55337 5.20833 8.31171 5.8 8.31171 6.5V17C8.31171 18.1 8.70337 19.0417 9.48671 19.825C10.27 20.6083 11.2117 21 12.3117 21C13.4117 21 14.3534 20.6083 15.1367 19.825C15.92 19.0417 16.3117 18.1 16.3117 17V6.5H17.8117V17C17.8117 18.5333 17.2784 19.8333 16.2117 20.9C15.145 21.9667 13.845 22.5 12.3117 22.5Z"
                                    fill="#1967D2" />
                            </svg>
                        </span>
                        <h4 style="text-align: center">{{ progress }}</h4>
                    </div>

                    <div class="modal__actions">
                        <button type="button" @click="closeModal(`#${props.id}`)">
                            Отмена
                        </button>
                        <button type="submit" :disabled="btnDisabled">Добавить</button>
                    </div>
                </form>

            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref, onMounted, defineEmits, computed, defineExpose, watch } from "vue";
    import { useStore } from "../store/index";
    import axios from "axios";
    import { usePopupStore } from '@/components/ThePopup'
    const popup = usePopupStore()

    const props = defineProps(['id']);

    const store = useStore();
    const emit = defineEmits(["updateDatas"]);

    // variables
    const base_url = "https://espp.su/sirius/anketa.php";

    const name = ref("");
    const level = ref("");
    const status = ref("");
    // const name2 = ref("");
    const url = ref(null);
    const progress = ref("");
    const names = ref([]);
    const directions2 = ref([]);
    const update_id_meropriyatiya = ref(null);
    const is_image_changed = ref(false)
    const old_path_to_image = ref(null)

    // Добавляем список сертификатов
    const certificateSubjects = ['Сертификат 20 баллов', 'Сертификат 10 баллов', 'Сертификат 5 баллов', 'Прочие достижения'];

    // Computed property для проверки является ли выбранный предмет сертификатом
    const isCertificateSubject = computed(() => {
        return certificateSubjects.includes(name.value);
    });

    // Следим за изменением name и устанавливаем значения для сертификатов
    watch(name, (newValue) => {
        if (certificateSubjects.includes(newValue)) {
            // Находим первые элементы в списках level и status
            const firstLevel = store.getPropertiesArray('competitionLevel', 'name')[2];
            const firstStatus = store.getPropertiesArray('status', 'name')[2];
            
            level.value = firstLevel;
            status.value = firstStatus;
        }
    });

    // computed
    const old_image_name = computed(() => {
        if (!old_path_to_image.value) return null;
        const picture_path = old_path_to_image.value;

        return picture_path.slice(picture_path.lastIndexOf('/') + 1);
    })

    const selected_subject_area = computed(() => {
        return store.subjectAreas.find((el) => el.subject == name.value);
    });

    const selected_level = computed(() => {
        const res = store.competitionLevel.find(
            (el) => el.name == level.value
        )?.level;
        return res ? res : 0;
    });

    const selected_status = computed(() => {
        const res = store.status.find((el) => el.name == status.value)?.status;
        return res ? res : 0;
    });

    const balls_result = computed(() => {
        if (!selected_subject_area.value?.ball) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const arr = [];

        for (let i = 0; i < 11; i++) {
            const value =
                selected_subject_area.value?.ball[i] *
                (selected_level.value ? selected_level.value : 1) *
                (selected_status.value ? selected_status.value : 1);
            arr.push(value ? value : 0);
        }

        return arr;
    });

    let directions_arr = [
        {
            id: 3,
            level: "математика",
        },
        {
            id: 4,
            level: "управление",
        },
        {
            id: 5,
            level: "физика",
        },
    ];

    let loading = ref(false);

    const btnDisabled = computed(() => {
        if (!name.value || !status.value || !level.value || !url.value || loading.value) {
            return true;
        }
        return false;
    })
    // check file size
    onMounted(() => {
        var fileInput = document.getElementById("file");
        fileInput.addEventListener("change", function () {
            if (fileInput.files.length > 0) {
                const fileSize = fileInput.files.item(0).size;
                const fileMb = fileSize / 1024 ** 2;
                if (fileMb >= 2) {
                    popup.fire({
                        icon: "error",
                        title: "Error!",
                        text: "Please select a file less than 2MB.",
                        confirmButtonText: "Close",
                    });
                    fileInput.value = "";
                    progress.value = "";
                } else {
                    url.value = "something";
                    progress.value = "Uploaded!";
                }
            }
        });

        axios
            .post(base_url, {
                tip: "nameDostig",
                name: "",
            })
            .then(function (response) {
                response.data.forEach((item) => {
                    names.value.push(item.name);
                });
            });

        //
        let data = directions_arr.map((x) => x.level);
        data = data.filter((value, index) => data.indexOf(value) == index);
        directions2.value = data;

        // Declare a new array
        let newArray = [];
        let uniqueObject = {};
        let objTitle = "";
        for (let i in directions_arr) {
            objTitle = directions_arr[i]["level"];
            uniqueObject[objTitle] = directions_arr[i];
        }
        for (let i in uniqueObject) {
            newArray.push(uniqueObject[i]);
        }
    });

    function updateImg() {
        is_image_changed.value = true;
    }


    function setModalData(data) {
        console.log('data', data)
        update_id_meropriyatiya.value = data.id_meropriyatiya;
        old_path_to_image.value = data.PicturePath;

        const img = document.createElement('img')
        img.src = data.PicturePath;

        img.onload = () => {
            // const picture_path = data.PicturePath;
            const file = new File([img], old_image_name.value);

            // new FileList() нельзя сделать, поэтому воспользуемся лайфхаком
            // Создаем коллекцию файлов:
            let dt = new ClipboardEvent('').clipboardData || new DataTransfer();
            dt.items.add(file);
            let file_list = dt.files;

            // Вставим созданную коллекцию в реальное поле:
            document.getElementById("file").files = file_list;
        }

        is_image_changed.value = false;
        url.value = "something";
        name.value = data.subject;
        
        level.value = store.competitionLevel.find(el => el.level == data.level).name;
        status.value = store.status.find(el => el.status == data.status).name;
    }

    defineExpose({
        setModalData
    })

    function addData() {
        loading.value = true;
        let file = document.getElementById("file").files[0];


        const payload = new FormData();

        let id_meropriyatiya = +store.dostiz.at(-1)?.id_meropriyatiya + 1;
        if (!id_meropriyatiya) id_meropriyatiya = 0;
        if (update_id_meropriyatiya.value) id_meropriyatiya = update_id_meropriyatiya.value;

        payload.append("tip", update_id_meropriyatiya.value ? "updateDostig" : "setDostig");
        payload.append("idMeropriatiya", id_meropriyatiya);

        payload.append("idStudent", parseFloat(store.user.id));
        payload.append("subject", name.value);

        if (update_id_meropriyatiya.value) {
            if (is_image_changed.value) {
                console.log(file.name);
                axios.get(`https://espp.su/sirius/anketa.php?tip=delImage&PicturePath=${old_image_name.value}`)

                payload.append("picture", file, file.name);
            }
        } else {
            payload.append("picture", file, file.name);
        }

        payload.append("status", store.status.find(el => el.name == status.value)?.status);
        payload.append("level", store.competitionLevel.find(el => el.name == level.value)?.level);

        payload.append("ball", selected_subject_area.value.ball);

        axios
            .post(base_url, payload)
            .then(function (response) {
                loading.value = false;
                
                if (update_id_meropriyatiya.value) {
                    popup.fire({
                        icon: "success",
                        title: "Отлично",
                        text: "Достижение обновлено!",
                        confirmButtonText: "OK",
                    });
                } else {
                    popup.fire({
                        icon: "success",
                        title: "Отлично",
                        text: "Достижение добавлено!",
                        confirmButtonText: "OK",
                    });
                }

                document.getElementById("file").value = "";
                name.value = "";
                level.value = "";
                progress.value = "";
                update_id_meropriyatiya.value = null;
                emit("updateDatas");
                closeModal(`#${props.id}`);
            })
            .catch(function (error) {
                loading.value = false;
                console.log(error);
            });
    }

    // close modal
    function closeModal(id) {
        let modal = document.querySelector(id);
        let bg = modal.querySelector(".modal__bg");
        let content = modal.querySelector(".modal__content");

        bg.style.opacity = "0";
        content.style.opacity = "0";
        content.style.transform = "scale(0.8)";
        setTimeout(() => {
            modal.style.display = "none";
        }, 700);

        document.getElementById("file").value = "";
        name.value = "";
        level.value = "";
        progress.value = "";
    }
</script>

<style scoped>
    @media (height < 520px) {
        .modal {
            font-size: 0.8rem;
        }

        .modal__actions {
            margin-top: 0.5rem;
        }

        .login__item span {
            padding: 1px;
        }

    }
</style>
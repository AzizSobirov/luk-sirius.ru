<template>
  <section class="main">
    <!-- Modals -->
    <the-modal
      ref="modal_element"
      id="modal-1"
      @updateDatas="updateDatas()"
    ></the-modal>
    <the-img id="modal-2" :url="url"></the-img>

    <!-- content -->
    <div class="main__content">
      <h3>Выберите направление основной программы обучения</h3>
      <!-- points -->
      <div class="main__points">
        <h4>Нажмите на кнопку с выбранным направлением</h4>

        <ul class="main__points-list">
          <li
            v-for="(button, index) in red_buttons"
            :class="[button.class, { active: button.active }]"
            @click="toggleActive(button, index)"
          >
            <div class="main__points-icon">
              <component :is="getComponent(button.direction)"></component>
            </div>
            <span>
              <h5>{{ button.name }}</h5>
              <h2>{{ button.sum_column }}</h2>
            </span>
          </li>
        </ul>
      </div>

      <h2>ИНФОРМАЦИЯ О ДОСТИЖЕНИЯХ УЧАСТНИКА</h2>

      <div v-if="store.dostiz?.length > 0" class="overflow">
        <table class="main__table">
          <thead>
            <tr>
              <th>Предметная область</th>
              <th>Уровень</th>
              <th>Статус участника</th>

              <th v-for="direction in store.getSuitableDirections">
                {{ direction.name }}
              </th>

              <th>Действия</th>
            </tr>
          </thead>

          <tbody>
            <tr
              @click="openModalOnCondition($event, item)"
              v-for="(item, idx) in store.dostiz"
              :key="idx"
            >
              <td>
                {{ item.subject }}
              </td>
              <td>
                {{ item.level }}
              </td>
              <td>
                {{ item.status }}
              </td>

              <td v-for="(ball, index) in all_balls[idx]">
                {{ ball }}
              </td>

              <td>
                <div class="action-buttons">
                  <a href="#" @click="openImage(item.PicturePath)">
                    <EyeSvg class="eye" />
                  </a>

                  <a
                    href="#"
                    @click="removeAction(item.id_meropriyatiya, item.role)"
                  >
                    <CrossSvg class="cross" />
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 v-else>No data found</h4>

      <!-- actions  -->
      <div class="main__actions">
        <div class="btn main__back" @click="backLogin()">
          <BackSvg />
          Назад
        </div>
        <div class="btn main__add-achievement" @click="openModal('#modal-1')">
          Добавить достижение
        </div>
        <div class="btn" @click="sendData()">Отправить результаты</div>
        <div class="btn main__list-applications" @click="info()">
          Перечень заявок
        </div>
        <div v-if="isAdmin" class="btn" @click="redirectToAdmin">
          Админ панель
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import BooksSvg from "@/assets/svg/books.svg";
import CodeSvg from "@/assets/svg/code.svg";
import WindowSvg from "@/assets/svg/window.svg";
import BackSvg from "@/assets/svg/back.svg";
import EyeSvg from "@/assets/svg/eye.svg";
import CrossSvg from "@/assets/svg/cross.svg";

import TheModal from "../components/TheModal.vue";
import TheImg from "../components/TheImg.vue";
import { ref, onMounted, computed, watch, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "../store/index";
import axios from "axios";
import { usePopupStore } from "@/components/ThePopup";
import { useCookie } from "@/composables.js";

const popup = usePopupStore();
const store = useStore();
const router = useRouter();
const { deleteCookie } = useCookie();

// variables
const url = ref("");
const base_url = "https://espp.su/sirius/anketa.php";
const modal_element = ref(null);
const isAdmin = computed(() => {
  //  console.log(localStorage.getItem('admin'));
  return localStorage.getItem("admin");
});
const all_balls = computed(() => {
  const all_balls = [];

  for (let dostiz of store.dostiz) {
    const ball = [];
    const dostiz_ball = dostiz.ball.split(",");

    const directions = store.getSuitableDirections;

    for (let i = 0; i < directions.length; i++) {
      ball.push(
        dostiz_ball[directions[i].id] *
          (dostiz.status ? dostiz.status : 1) *
          (dostiz.level ? dostiz.level : 1)
      );
    }

    all_balls.push(ball);
  }

  return all_balls;
});

const red_buttons = ref([]);
const selected_napravl = computed(() => {
  return red_buttons.value.find((btn) => btn.active)?.name;
});

watchEffect(() => {
  red_buttons.value = [];

  for (let i = 0; i < store.getSuitableDirections.length; i++) {
    const direction = store.getSuitableDirections[i];
    const sum_column = getSumColumn(i);

    red_buttons.value.push({
      direction: direction.direction,
      sum_column: sum_column,
      name: direction.name,
      class: "red",
      active: false,
    });
  }

  const sorted_buttons = [...red_buttons.value].sort(
    (el1, el2) => el2.sum_column - el1.sum_column
  );
  const classes = ["green", "yellow", "red"];

  if (sorted_buttons.length !== 0 && sorted_buttons[0].sum_column != 0) {
    sorted_buttons[0].class = classes[0];

    for (
      let i = 1, class_index = 1;
      i < sorted_buttons.length && class_index < classes.length;
      i++
    ) {
      const button = sorted_buttons[i];

      if (sorted_buttons[i - 1].sum_column == button.sum_column) {
        button.class = classes[class_index - 1];
      } else {
        button.class = classes[class_index];
        class_index++;
      }
    }
  }
});

// get user from local storage
onMounted(() => {
  // get user from local
  console.log(store.user);
  updateDatas();
});

function toggleActive(button, index) {
  red_buttons.value.forEach((btn) => (btn.active = false));
  button.active = true;
}

function openModalOnCondition(e, item) {
  if (!e.target.closest('div[class="action-buttons"]')) {
    openModal("#modal-1", item);
  }
}

function redirectToAdmin() {
  store.setUser(store.admin);
  // console.log(store.admin);
  //  store.setAdmin(null);
  router.push("/info");
}

function getSumColumn(index) {
  return all_balls.value.reduce((sum, el) => sum + el[index], 0);
}

function getComponent(direction) {
  if (direction == "IT- направление") {
    return CodeSvg;
  }
  if (direction == "Лидерство и управление") {
    return WindowSvg;
  }
  if (direction == "Естественно-научное") {
    return BooksSvg;
  }
  return BooksSvg;
}

// update user data
function updateDatas() {
  let query = {
    tip: "getDostig",
    idStudent: store.user?.id,
    idMeropriatia: 0,
  };
  console.log(query);
  axios
    .post(base_url, query)
    .then(function (response) {
      if (response.data != "Empty") {
        store.setDostiz(response.data);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
}
function info() {
  router.push("/info");
}

// Отправить результаты
function sendData() {
  if (selected_napravl.value) {
    const sum_column = red_buttons.value?.find(
      (direction) => direction.name == selected_napravl.value
    )?.sum_column;

    let query = {
      tip: "setNapravl",
      idStudent: parseFloat(store.user.id),
      napravl: selected_napravl.value,
      rating: sum_column,
    };

    axios
      .post(base_url, query)
      .then(function (response) {
        //console.log(response);

        popup.fire({
          icon: "success",
          title: "Success!",
          text: "спасибо за заполнение",
          confirmButtonText: "закрыть анкету",
        });
      })
      .catch((err) => alert(err));
  } else {
    popup.fire({
      icon: "error",
      title: "Ошибка!",
      text: "Определите программу обучения, нажав на одну из цветных кнопок вверху",
      confirmButtonText: "закрыть",
    });
  }
}

// open modal
function openModal(id, data) {
  if (data) {
    modal_element.value.setModalData(data);
  }
  let modal = document.querySelector(id);
  let bg = modal.querySelector(".modal__bg");
  let content = modal.querySelector(".modal__content");

  modal.style.display = "flex";
  setTimeout(() => {
    bg.style.opacity = "1";
    content.style.opacity = "1";
    content.style.transform = "scale(1)";
  }, 100);
}

// open img
function openImage(file) {
  url.value = file;
  openModal("#modal-2");
}

// remove modal
function removeAction(id, role) {
  popup
    .fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    })
    .then((result) => {
      if (result.value) {
        removeData(id, role);
      }
    });
}

// remove dostejenie from db
function removeData(id, role) {
  let query = {
    tip: "delDostig",
    id_student: parseFloat(store.user.id),
    id_meropriyatiya: parseFloat(id),
    role: role,
  };

  axios
    .post(base_url, query)
    .then(function (response) {
      popup.fire("Deleted!", "Your file has been deleted.", "success");
      updateDatas();
    })
    .catch(function (error) {
      console.log(error);
    });
}

// back to login
function backLogin() {
  console.log("back to login");

  // delete user from local storage
  store.deleteUser();
  deleteCookie("token");
  router.push("/auth");
}
</script>

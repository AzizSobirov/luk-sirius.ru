<template>
  <div class="container auth-container">
    <div class="tg-auth">
      <div class="auth__img-box img-box">
        <img class="auth__img" src="../assets/img/logo.jpg" alt="" />
      </div>

      <div class="content">
        <h2>
          Добро пожаловать в совместный <br />
          образовательный проект ЛУКОЙЛ и Сириус
        </h2>

        <button>Войти через Telegram</button>

        <p>
          При первом входе в систему вы соглашаетесь с
          <a href="#">политикой конфиденциальности</a>
        </p>

        <!-- <div class="login__item">
          <h4>Если вы зарегистрированы, введите СНИЛС</h4>
          <span :class="{ invalid: !isSnilsValid }">
            <input
              @input="checkUser"
              type="text"
              v-model="snils"
              name="mask"
              v-mask="'000-000-000-00'"
              placeholder="123-145-41-11"
              required
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <g clip-path="url(#clip0_19_98)">
                <path
                  d="M18 2C18.5304 2 19.0391 2.21071 19.4142 2.58579C19.7893 2.96086 20 3.46957 20 4V21C20 21.5304 19.7893 22.0391 19.4142 22.4142C19.0391 22.7893 18.5304 23 18 23H6C5.46957 23 4.96086 22.7893 4.58579 22.4142C4.21071 22.0391 4 21.5304 4 21V4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2H18ZM18 4H6V21H18V4ZM14 16C14.2652 16 14.5196 16.1054 14.7071 16.2929C14.8946 16.4804 15 16.7348 15 17C15 17.2652 14.8946 17.5196 14.7071 17.7071C14.5196 17.8946 14.2652 18 14 18H10C9.73478 18 9.48043 17.8946 9.29289 17.7071C9.10536 17.5196 9 17.2652 9 17C9 16.7348 9.10536 16.4804 9.29289 16.2929C9.48043 16.1054 9.73478 16 10 16H14ZM12 6C13.0609 6 14.0783 6.42143 14.8284 7.17157C15.5786 7.92172 16 8.93913 16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10C8 8.93913 8.42143 7.92172 9.17157 7.17157C9.92172 6.42143 10.9391 6 12 6ZM12 8C11.4696 8 10.9609 8.21071 10.5858 8.58579C10.2107 8.96086 10 9.46957 10 10C10 10.5304 10.2107 11.0391 10.5858 11.4142C10.9609 11.7893 11.4696 12 12 12C12.5304 12 13.0391 11.7893 13.4142 11.4142C13.7893 11.0391 14 10.5304 14 10C14 9.46957 13.7893 8.96086 13.4142 8.58579C13.0391 8.21071 12.5304 8 12 8Z"
                  fill="#1967D2"
                />
              </g>
              <defs>
                <clipPath id="clip0_19_98">
                  <rect width="24" height="24" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </span>
          <p class="error" v-if="!isSnilsValid">СНИЛС недействительный</p>
        </div>

        <h4>Согласие на обработку персональных данных</h4> -->

        <!-- <div class="login__item">
          <input type="checkbox" id="consent" v-model="consent" />
          <label for="consent"
            >Я согласен на обработку персональных данных</label
          >
          <span>
            <div class="">
              <router-link to="/"
                >Если Вы еще не зарегистрированы, нажмите на эту
                надпись</router-link
              >
            </div>
          </span>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "../store/index";
import { useSnilsValidator } from "../composables.js";
import { usePopupStore } from "@/components/ThePopup";
import axios from "axios";

const router = useRouter();
const store = useStore();
const popup = usePopupStore();
const snils = ref("");
const datar = ref("");
const { isSnilsValid, validateSnils } = useSnilsValidator(snils);

async function checkUser() {
  validateSnils();

  store.setDostiz(null);
  store.setUser(null);
  store.setAdmin(null);
  store.setGlobalAdmin(null);
  localStorage.clear();

  if (snils.value.length > 13) {
    // Сначала проверяем, является ли СНИЛС админским
    const isAdmin = store.snils_admins.includes(snils.value);
    //  console.log(isAdmin);
    if (isAdmin) {
      // Если это админ из списка, создаем базового пользователя-админа
      store.setGlobalAdmin({
        snils: snils.value,
        admin: 1,
        obshestvo: "ALL",
      });
      //  console.log();
      store.setUser({
        snils: snils.value,
        admin: 2,
        obshestvo: "ALL",
      });
      // console.log("Global:",store.isGlobalAdmin, "Local:",store.isLocalAdmin, "Admin:",store.isAdmin);
      popup.fire({
        icon: "success",
        title: "Добро пожаловать, главный админ!",
        showConfirmButton: false,
        timer: 1500,
      });
      router.push("/info");
      return;
    }

    // Если это не админ из списка, проверяем в БД
    let query = {
      tip: "searchStudent",
      dateRozdenia: datar.value,
      snils: snils.value,
    };

    try {
      const response = await axios.post(
        `https://espp.su/sirius/anketa.php`,
        query
      );
      // console.log('Данные пользователя:', response.data.user);
      if (response.data.user.admin == 1) {
        store.setAdmin({
          snils: snils.value,
          admin: 1,
          user: response.data.user,
        });

        store.setDostiz(response.data.dostiz);
        store.setUser(response.data.user);

        popup.fire({
          icon: "success",
          title:
            "Добро пожаловать" +
            response.data.user.familia +
            " " +
            response.data.user.imya +
            " " +
            response.data.user.obshestvo,
          showConfirmButton: false,
          timer: 1500,
        });

        router.push("/info");
        return;
      }
      //  if (response.data != "Empty") {
      //      store.setDostiz(response.data.dostiz);
      //     store.setUser(response.data.user);
      //   popup.fire({
      //        icon: "success",
      //        title: "Добро пожаловать" + response.data.user.familia + " " + response.data.user.imya + " " + response.data.user.obshestvo,
      //        showConfirmButton: false,
      //        timer: 1500
      //      });
      //     router.push("/main");
      //  }
      //   else {
      popup.fire({
        icon: "error",
        //title: "Пользователь не найден",
        title: "Сбор заявок завершен",
        showConfirmButton: false,
        timer: 1500,
      });
      //  }
    } catch (error) {
      console.error("Ошибка при проверке пользователя:", error);
      popup.fire({
        icon: "error",
        title: "Ошибка при входе",
        text: "Пожалуйста, попробуйте позже",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  }
}
</script>

<style lang="scss">
.tg-auth {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;

  .content {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  button {
    padding: 10px 20px;
    border-radius: 99999px;
    background-color: #1967d2;
    color: #fff;
  }

  p {
    color: #555;
    font-size: 12px;
  }
}
</style>

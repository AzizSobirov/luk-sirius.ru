<template>
  <div class="container auth-container">
    <div class="tg-auth">
      <div class="auth__img-box img-box">
        <img class="auth__img" src="@/assets/img/logo.jpg" alt="" />
      </div>

      <div class="content">
        <h2>
          Добро пожаловать в совместный <br />
          образовательный проект ЛУКОЙЛ и Сириус
        </h2>

        <button @click="generateSession">Войти через Telegram</button>

        <p>
          При первом входе в систему вы соглашаетесь с
          <a href="#">политикой конфиденциальности</a>
        </p>
      </div>
    </div>

    <!-- QR Code Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Войти через Telegram</h3>
            <button class="close-btn" @click="closeModal">&times;</button>
          </div>

          <div class="modal-body">
            <div class="qr-container">
              <VueQrcode
                v-if="url"
                :value="url"
                :width="200"
                :height="200"
                :color="{
                  light: '#f9f9f9',
                  dark: '#000000',
                }"
                type="image/png"
                :margin="0"
              />
            </div>

            <p class="instruction">
              Отсканируйте QR-код или перейдите по ссылке в Telegram
            </p>

            <div class="link-container">
              <a :href="url" target="_blank" class="telegram-link">
                Открыть в Telegram
              </a>
            </div>

            <div class="status-indicator">
              <div class="loading-spinner"></div>
              <span>Ожидание подтверждения...</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "../../store/index";
import http from "@/libs/axios.js";
import { toast } from "vue-sonner";
import VueQrcode from "vue-qrcode";
import { useCookie } from "@/composables.js";

const router = useRouter();
const store = useStore();
const { setCookie } = useCookie();

const authKey = ref(null);
const url = ref(null);
const showModal = ref(false);

let statusTimeout = null;

const generateSession = async () => {
  try {
    const { data } = await http.post("/auth/generate");
    console.log(data);

    if (data) {
      if (!data.success) {
        toast.error("Произошла ошибка при генерации сессии");
        return;
      }

      authKey.value = data.authKey;
      url.value = data.qrData;
      showModal.value = true;

      checkStatus();
    }
  } catch (e) {
    console.log(e);
    toast.error("Произошла ошибка при подключении");
  }
};

const closeModal = () => {
  showModal.value = false;
  if (statusTimeout) {
    clearTimeout(statusTimeout);
    statusTimeout = null;
  }
  // Reset values
  authKey.value = null;
  url.value = null;
};

const checkStatus = async () => {
  if (!authKey.value) return;

  try {
    const { data } = await http.get(`/auth/status/${authKey.value}`);

    if (data.status === "completed") {
      toast.success("Вы успешно вошли в систему");
      if (statusTimeout) clearTimeout(statusTimeout);

      // Close modal on success
      showModal.value = false;

      store.setUser(data.user);
      setCookie("token", data.token);

      if (!data.user.isRegistered) {
        router.push("/auth/register");
      } else {
        router.push("/");
      }

      return;
    }

    if (data.status === "expired") {
      toast.error("Сессия истекла. Пожалуйста, попробуйте снова.");
      if (statusTimeout) clearTimeout(statusTimeout);
      closeModal();
      return;
    }

    statusTimeout = setTimeout(checkStatus, 3000);
  } catch (e) {
    console.log(e);
    if (statusTimeout) clearTimeout(statusTimeout);
    toast.error("Ошибка проверки статуса");
  }
};
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
    border: none;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: #1557b0;
    }
  }

  p {
    color: #555;
    font-size: 12px;
  }
}

// Modal transition classes
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: all 0.3s ease-out;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  opacity: 0;
  transform: translateY(-50px) scale(0.9);
}

// Modal styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;

  h3 {
    margin: 0;
    font-size: 18px;
    color: #333;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;

    &:hover {
      background-color: #f5f5f5;
      color: #333;
    }
  }
}

.modal-body {
  padding: 24px;
  text-align: center;

  .qr-container {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
  }

  .instruction {
    color: #666;
    font-size: 14px;
    margin-bottom: 20px;
    line-height: 1.4;
  }

  .link-container {
    margin-bottom: 24px;

    .telegram-link {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0088cc;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: #0077b3;
      }
    }
  }

  .status-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #666;
    font-size: 14px;

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #e0e0e0;
      border-top: 2px solid #1967d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// Responsive design
@media (max-width: 480px) {
  .modal-content {
    margin: 20px;
    width: calc(100% - 40px);
  }

  .modal-body {
    padding: 20px;

    .qr-container {
      padding: 15px;
    }
  }
}
</style>

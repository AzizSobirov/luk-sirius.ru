<template>
  <div class="container">
    <header>
      <h1>Перечень поданных заявок</h1>
    </header>

    <main class="main-info">
      <div v-if="storeStore.isAdmin" class="buttons mb-2">
        <div
          v-if="storeStore.isGlobalAdmin"
          class="btn btn-download mr-2"
          @click="downloadXLSX"
        >
          Скачать
        </div>
        <div
          v-if="storeStore.isGlobalAdmin"
          class="btn btn-download"
          @click="downloadXLSXFull"
        >
          Скачать с достижениями
        </div>
        <div
          v-if="storeStore.isLocalAdmin"
          class="btn btn-download mr-2"
          @click="downloadXLSX"
        >
          Скачать данные организации
        </div>
        <div
          v-if="storeStore.isLocalAdmin"
          class="btn btn-download"
          @click="downloadXLSXFull"
        >
          Скачать данные организации с достижениями
        </div>
      </div>

      <InfoOrg
        v-for="(data, index) in getDatas"
        :key="index"
        :Obshestvo="data?.obshestvo"
        :students="data?.students"
      />
    </main>
    <footer>
      <div class="footer__content">
        <div class="column">
          <div class="btn back-btn" @click="$router.push('/main')">
            <BackSvg />
            Назад
          </div>
        </div>

        <h2>
          {{
            storeStore.isGlobalAdmin
              ? "Итого по всем Организациям:"
              : storeStore.isLocalAdmin
              ? "Итого по вашей Организации:"
              : "Заявок по Обществу:"
          }}
        </h2>
      </div>

      <div class="footer__info">
        <div class="potok" v-for="(potok, index) in potoks">
          <h3>{{ index + 1 }} поток:</h3>
          <div class="potok__count">{{ potok }} чел.</div>
        </div>

        <div class="potok">
          <h3>Всего:</h3>
          <div class="potok__count">
            {{ potoks.reduce((sum, el) => sum + el, 0) }} чел.
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import axios from "axios";
import InfoOrg from "../components/Organisation_Table.vue";
import BackSvg from "@/assets/svg/back.svg";
import { mapStores } from "pinia";
import { useStore } from "../store/index";
import ExcelJS from "exceljs";
import FileSaver from "file-saver";

export default {
  data: function () {
    return {
      students: [],
      datas: [],
      allPotok: 0,
      obshestvo: "ALL",
    };
  },
  mounted: function () {
    // Инициализируем массив datas, включая организации и департаменты
    this.datas = [
      ...this.storeStore.SpisokObshestv.map((org) => ({
        obshestvo: org,
        students: [],
      })),
      ...this.storeStore.departments.map((dept) => ({
        obshestvo: dept,
        students: [],
      })),
    ];
    this.sendData();

    setInterval(() => {
      this.sendData();
    }, 60000);
  },
  computed: {
    ...mapStores(useStore),
    potoks() {
      let arr = [];
      const number_pokoks = 6;

      for (let i = 0; i < number_pokoks; i++) {
        arr.push(this.getCountPotok(i + 1));
      }

      return arr;
    },
    getDatas() {
      if (this.storeStore.isGlobalAdmin) {
        return this.datas.filter((el) => {
          return el.students && el.students.length > 0;
        });
      } else {
        if (!this.storeStore.user) return [];

        return [
          this.datas.find((el) => {
            return el.obshestvo == this.storeStore.user.obshestvo;
          }),
        ];
      }
    },
    getStudents() {
      const students = [];
      this.getDatas.forEach((data) => {
        if (data?.students)
          data.students.forEach((student) => students.push(student));
      });

      return students;
    },
  },
  methods: {
    getCountPotok(number) {
      let count = 0;
      if (this.storeStore.isGlobalAdmin) {
        this.getStudents.forEach((el) => {
          if (el.potok == number) count++;
        });
      } else {
        this.getStudents?.forEach((el) => {
          if (
            el.potok == number &&
            el.obshestvo == this.storeStore.user.obshestvo
          )
            count++;
        });
      }
      return count;
    },
    async downloadXLSXFull() {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Users");
      worksheet.columns = [
        { header: "Организация", key: "obshestvo", width: 35 },
        { header: "Дата подачи", key: "date", width: 20 },
        { header: "Фамилия", key: "familia", width: 15 },
        { header: "Имя", key: "imya", width: 15 },
        { header: "Отчество", key: "otchestvo", width: 15 },
        { header: "Поток", key: "potok", width: 10 },
        { header: "Направление обучения", key: "napravl", width: 45 },
        { header: "Балл", key: "rating", width: 10 },

        { header: "Предметная область", key: "subject", width: 35 },
        { header: "Вес области", key: "scores", width: 10 },
        { header: "Уровень мероприятия", key: "level" },
        { header: "Статус участника", key: "status" },
        { header: "Изображение", key: "PicturePath", width: 100 },
      ];
      worksheet.getRow(1).font = { bold: true };

      // Определяем параметр obshestvo в зависимости от типа администратора
      let obshestvo;
      if (this.storeStore.isGlobalAdmin) {
        obshestvo = "ALL";
      } else {
        const currentOrg = this.datas.find((el) => {
          return el.obshestvo == this.storeStore.user.obshestvo;
        });
        obshestvo = `'${currentOrg?.obshestvo}'`;
      }

      console.log("Организация для выгрузки:", obshestvo);

      axios
        .post(`https://espp.su/sirius/anketa.php`, {
          tip: "vigruzka",
          obshestvo: obshestvo,
        })
        .then(async (response) => {
          const data = response.data;

          for (let key in data) {
            const user = data[key];
            const directionId = this.storeStore.educationDirections.find(
              (dir) => dir.name === user.napravl
            )?.id;

            console.log(user, directionId);
            worksheet.addRow([
              user.obshestvo,
              user.date,
              user.familia,
              user.imya,
              user.otchestvo,
              +user.potok,
              user.napravl,
              +user.rating,
            ]);

            const dostig = user.dostig;
            let dostigCount = 0;
            for (let key in dostig) {
              const dostiz = dostig[key];
              dostigCount++;

              // Преобразуем строку ball в массив чисел
              const ballArray = dostiz.ball.split(",").map(Number);
              //   console.log(ballArray[directionId], directionId);
              worksheet.addRow({
                subject: dostiz.subject,
                //  scores: directionId ? ballArray[directionId] : 0,
                scores: ballArray[directionId],
                level: +dostiz.level,
                status: +dostiz.status,
                PicturePath: dostiz.PicturePath,
              });

              // Добавляем формулу умножения для столбцов J, K, L
              worksheet.getCell("H" + worksheet.rowCount).value = {
                formula: `=J${worksheet.rowCount}*K${worksheet.rowCount}*L${worksheet.rowCount}`,
              };

              worksheet.getCell("M" + worksheet.rowCount).value = {
                text: dostiz.PicturePath,
                hyperlink: dostiz.PicturePath,
              };
            }

            // Добавляем формулу суммы для всех достижений пользователя
            if (dostigCount > 0) {
              const firstDostigRow = worksheet.rowCount - dostigCount + 1;
              const lastDostigRow = worksheet.rowCount;
              //     worksheet.addRow();
              worksheet.getCell("H" + (firstDostigRow - 1)).value = {
                formula: `=SUM(H${firstDostigRow}:H${lastDostigRow})`,
              };
            }
          }

          const buffer = await workbook.xlsx.writeBuffer();
          FileSaver.saveAs(new Blob([buffer]), "users.xlsx");
        });
    },
    async downloadXLSX() {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Users");
      worksheet.columns = [
        { header: "Организация", key: "obshestvo", width: 35 },
        { header: "Дата подачи", key: "date", width: 20 },
        { header: "Фамилия", key: "familia", width: 15 },
        { header: "Имя", key: "imya", width: 15 },
        { header: "Отчество", key: "otchestvo", width: 15 },
        { header: "Поток", key: "potok", width: 10 },
        { header: "Направление обучения", key: "napravl", width: 45 },
        { header: "Балл", key: "rating", width: 10 },
        { header: "Дата рождения", key: "date_rozd", width: 20 },
        { header: "Телефон", key: "telephone", width: 10 },
      ];
      worksheet.getRow(1).font = { bold: true };

      this.getStudents.forEach((user) => {
        worksheet.addRow([
          user.obshestvo,
          user.date,
          user.familia,
          user.imya,
          user.otchestvo,
          +user.potok,
          user.napravl,
          +user.rating,
          user.date_rozd,
          user.telephone,
        ]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      FileSaver.saveAs(new Blob([buffer]), "users.xlsx");
    },
    sendData() {
      // Очищаем localStorage
      //   localStorage.clear();

      axios
        .post(`https://espp.su/sirius/anketa.php`, {
          tip: "infoStudents",
          obshestvo: this.obshestvo,
        })
        .then((response) => {
          // Обновляем только списки студентов, сохраняя структуру организаций
          const responseData = response.data;
          this.datas = this.datas.map((org) => ({
            obshestvo: org.obshestvo,
            students: responseData.filter(
              (item) => item.obshestvo === org.obshestvo
            ),
          }));

          // Инициализируем store.dostiz как массив, если он не существует
          //    if (!this.storeStore.dostiz || !Array.isArray(this.storeStore.dostiz)) {
          //        this.storeStore.setDostiz([]);
          //    }
        });
    },
  },
  components: {
    InfoOrg,
    BackSvg,
  },
};
</script>

<style lang="scss">
* {
  box-sizing: border-box;
}

.container {
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  font-family: "Jost", sans-serif;
  min-height: 100vh;
  max-width: 1200px;

  @media screen and (min-width: 1440px) {
    width: 1440px;
  }
}

header,
footer {
  width: 100%;
  background-color: rgb(8, 6, 97);
  color: #fff;
}

header {
  position: fixed;
  top: 0;
  max-width: 1200px;

  @media screen and (min-width: 1440px) {
    width: 1440px;
  }
}

footer {
  padding: 0.5rem;
  position: fixed;
  bottom: 0;
  max-width: 1200px;

  @media screen and (min-width: 1440px) {
    width: 1440px;
  }
  .back-btn {
    height: 40px;
  }
}

main {
  padding: 80px 0 120px;
}

.footer__info {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  justify-content: space-around;
  gap: 0.5rem;
  .potok {
    margin: 0;
  }
}

.potok {
  margin: 10px;
  display: flex;
  border: 2px solid wheat;
  min-width: 200px;

  .potok__count {
    width: 100px;
  }
}
.footer__content {
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: row;
}
@media (width < 900px) {
  .footer__info {
    grid-template-columns: repeat(2, 1fr);
  }
  footer {
    .potok {
      margin: 5px;
    }
  }

  .back-btn {
    height: 30px !important;
    width: auto !important;
  }
}
@media (width < 500px) {
  footer,
  header {
    font-size: 0.8rem;
    padding: 3px;
  }
}
@media (width < 420px) {
  header {
    font-size: 0.7rem;
  }
  .footer__info {
    gap: 0.1rem;
    h3,
    .potok__count {
      width: auto;
    }
    h3 {
      margin-right: 0.5rem;
    }
    .potok {
      margin: 3px;
      padding: 3px;
      min-width: auto;
    }
  }
}
.footer__content .column {
  justify-content: center !important;
}

main {
  margin: 0 auto;
  width: 100%;
}

.table {
  margin-top: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #000;
}

.buutons {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}

.main-info {
  margin-bottom: 50px;
}

@media (width < 900px) {
  .main-info {
    margin-bottom: 120px;
  }
}

.buttons {
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 1rem;
}

.btn-download {
  padding: 8px 16px;
  cursor: pointer;
  white-space: nowrap;
}
</style>

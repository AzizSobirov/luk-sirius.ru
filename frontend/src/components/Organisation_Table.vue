<template>
    <div class="nameObsh">
        <h3>Организация:</h3>
        <h4>{{ Obshestvo }}</h4>
    </div>

    <div v-if="store.isAdmin" class="zayavki">
        <h3>Заявок по Обществу:</h3>

        <div class="potok" v-for="number in 6">
            <h4>{{ number }} поток:</h4>
            <h4>{{ getPotok(number) }}</h4>
        </div>
    </div>

    <v-table>
        <thead>
            <tr>
                <th class="text-left">№</th>
                <th class="text-left">Дата подачи</th>
                <th class="text-left">ФИО</th>
                <th class="text-left">Поток</th>
                <th class="text-left">Направление обучения</th>
                <th class="text-left">Балл</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(item, index) in getStudents" :key="item.familia">
                <td>{{ index + 1 }}</td>
                <td>{{ item.date }}</td>
                <td class="link" @click="redirectToStudent(item)">
                    {{ item.familia + " " + item.imya + " " + item.otchestvo }}
                </td>
                <td>{{ item.potok }}</td>
                <td>{{ item.napravl }}</td>
                <td>{{ item.rating }}</td>
            </tr>
        </tbody>
    </v-table>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "../store/index";
import { useRouter } from "vue-router";

const props = defineProps(["Obshestvo", "students"]);
const store = useStore();
const router = useRouter();

function redirectToStudent(student) {
  //  console.log(student);
  // console.log(store.user);
  //  if (store.isAdmin) {
  if(localStorage.getItem("admin") == 1) {
        store.setAdmin(store.user)
        store.setUser(student)
        router.push('/main')
    }
    if(localStorage.getItem("admin") == 2) {
        store.setGlobalAdmin(store.user)
        store.setUser(student)
      //  store.setDostiz(student)
        router.push('/main')
    }
}

function getPotok(potok_number) {
    if (!props.students) return 0;

    let potok = 0;
    props.students.forEach((item) => {
        if (item.potok == potok_number) {
            potok += 1;
        }
    });
    return potok;
}

const getStudents = computed(() => {
    if (!props.students) return [];

    props.students.sort(function (a, b) {
        return b.rating - a.rating;
    });
    return props.students;
});
</script>

<style scoped>
.nameObsh {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
}

.potok {
    display: flex;
}

.zayavki {
    display: flex;
    flex-wrap: wrap;
}
.link {
    cursor: pointer;
}
.link:hover {
    color: blue;
}
</style>

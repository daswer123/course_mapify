"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts__list");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

// DATA
// Основной класс тренировок
class Workout {
  constructor(location, distance, time) {
    this.location = location;
    this.distance = distance;
    this.time = time;

    this.id = Date.now();
    this.date = new Date();
    this.day = this.date.getDate();
    this.months = this.date.getMonth();
  }
}

// Пробежка
class Running extends Workout {
  constructor(location, distance, time, cad) {
    super(location, distance, time);
    this.cad = cad;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.distance / this.time;
    return this.pace;
  }
}

// Езда на велосепеде
class Cycling extends Workout {
  constructor(location, distance, time, elev) {
    super(location, distance, time);
    this.elev = elev;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / this.time;
    return this.speed;
  }
}

//APP
class App {
  constructor() {
    this.map = "";
    this.workOuts = [];
    this.isCycling = false;

    // Получаем данные из Локала, после инициализируем карту и получаем текущую геопозицию пользователя
    this.getLocalStorageData();
    this.loadMap().getPos();

    // Привязываем все методы к слушетелям, так же привязываем контекст
    inputType.addEventListener("change", this.toggleElevationField.bind(this));
    form.addEventListener("submit", this.newWorkOut.bind(this));
    containerWorkouts.addEventListener("click", this.moveToMaker.bind(this));
  }

  // Получаем гео от пользователя, если нет, выдаем ошибку и ставим рандомные значения координат
  getPos() {
    navigator.geolocation &&
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          this.coords = [coords.latitude, coords.longitude];
          this.map.setView(this.coords, 13);
        },
        (err) => {
          console.log("Cannot get GEO " + err);
          this.coords = [43, 21];
        }
      );

    return this;
  }

  // Инициализируем карту и загружаем тайлсет из гугл карт
  loadMap() {
    this.map = L.map("map");
    L.tileLayer("http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(this.map);
    // При клике на карту в стейт записывается событие клика, а так же показывается форма для заполнения
    this.map.on("click", (mapE) => {
      this.mapEvent = mapE;
      this.showForm();
      inputDuration.value = inputDistance.value = "";
    });

    // Рендерим все упражнения и маркеры к ним
    this.renderWorkOuts();
    this.workOuts.forEach(this.renderPopMaker.bind(this)); // RENDER ALL MARKERS

    return this;
  }

  showForm() {
    form.style.display = "grid";
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  // Добавляем display none для моментального скрытия с поле зрения и очищаем все инпуты
  hideForm() {
    form.style.display = "none";
    form.classList.add("hidden");
    inputElevation.value =
      inputDuration.value =
      inputDistance.value =
      inputCadence.value =
        "";
  }

  // При переключении происходит смена класса и очищаются соответсвующие инпуты
  toggleElevationField() {
    inputElevation.parentElement.classList.toggle("form__row--hidden");
    inputCadence.parentElement.classList.toggle("form__row--hidden");

    this.isCycling = this.isCycling ? false : true;

    inputElevation.value = inputCadence.value = "";
    return this;
  }

  // Создаем новое упражение, рендерим и добавляем маркер
  newWorkOut(e) {
    e.preventDefault();

    const validNum = (...inputs) => {
      // Проверка всех входящих данных на число
      return inputs.every((el) => Number.isFinite(el));
    };

    const isAllPositve = (...inputs) => {
      // Проверка всех входящих данных на Положительное число
      return inputs.every((el) => el >= 0);
    };

    // Значение всех инпутов приводим к числу
    const dist = +inputDistance.value;
    const time = +inputDuration.value;
    const calc = inputElevation.value
      ? +inputElevation.value
      : +inputCadence.value;

    if (!validNum(dist, time, calc)) {
      alert("Wrong Data");
      return;
    }

    if (!isAllPositve(dist, time, calc)) {
      alert("All num must be Positive");
      return;
    }

    // Собираем параметры из инпутов и события клика по карте и создаем новый инстанс класса на их основе
    const coords = [this.mapEvent?.latlng.lat, this.mapEvent?.latlng.lng];
    const params = [coords, dist, time];
    let currentWorkOut;
    if (this.isCycling) {
      currentWorkOut = new Cycling(...params, calc);
    }

    if (!this.isCycling) {
      currentWorkOut = new Running(...params, calc);
    }

    // Добавляем новый класс в общий массив, рендерим все упражнения снова и записываем в локальное хранилище, так же убираем форму
    this.workOuts.push(currentWorkOut);
    this.renderWorkOuts();
    this.renderPopMaker(currentWorkOut);
    this.setLocalStorage();

    this.hideForm();

    // Set Local Storage
  }

  renderWorkOuts() {
    containerWorkouts.innerHTML = ""; // Очищаем контейнер перед рендером
    this.workOuts.forEach((workout) => {
      // Проходим по всему массиву с тренировками и формируем верстку
      const type = workout.constructor.name; // Благодаря классам узнаем имя тренировки из конструктора
      const isRunning = type === "Running";

      containerWorkouts.insertAdjacentHTML(
        // Формируем верстку
        "afterbegin",
        `
      <li class="workout workout--${type.toLocaleLowerCase()}" data-id="${
          workout.id
        }">
    <h2 class="workout__title">${type} on ${months[workout.months]} ${
          workout.day
        }</h2>
    <div class="workout__details">
      <span class="workout__icon">${isRunning ? "🏃‍♂️" : "🚴‍♀️"}</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.time}</span>
      <span class="workout__unit">min</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${
        isRunning
          ? Math.round(workout.pace * 100) / 100
          : Math.round(workout.speed * 100) / 100
      }</span>
      <span class="workout__unit">${isRunning ? "min/m" : "km/h"}</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">${isRunning ? "🏃‍♂️" : "🚴‍♀️"}</span>
      <span class="workout__value">${
        isRunning ? workout.cad : workout.elev
      }</span>
      <span class="workout__unit">${isRunning ? "spm" : "m"}</span>
    </div>
  </li>
      `
      );
    });
  }

  renderPopMaker(work) {
    const type = work.constructor.name; // Получаем тип благодаря имени в конструкторе
    // this.coords = [this.mapEvent.latlng.lat, this.mapEvent.latlng.lng];

    // Создаем попап с необходимыми параметрами и классом
    const workPopup = L.popup({
      className: `${type}-popup`,
      minWidth: 250,
      maxWidth: 100,
      autoClose: false,
      closeOnClick: false,
    });

    // Пишем контент в попап на основе текущего упражения
    workPopup.setContent(
      `${type.toLowerCase() === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${type} on ${
        months[work.months]
      } ${work.day}`
    );
    L.marker(work.location).addTo(this.map).bindPopup(workPopup).openPopup(); // Добавляем маркер на карту
  }
  // Функция перемещиния при клики на маркер
  moveToMaker(e) {
    const work = e.target.closest(".workout"); // Определяем упражение и избегаем ненужных срабатываний
    if (work) {
      // Если мы кликнем по элементу, который или у которого родитель workout, то мы продолжим обработку
      const workout = this.workOuts.find(
        (workout) => workout.id == work.dataset.id
      );
      this.map.flyTo(workout.location, 14); // Метод для плавной прокрутке к нужным координатам
    }
  }

  // Записываем все упраженения в локальное хранилище
  setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.workOuts));
  }

  // Получаем данные из локального хранилища и приписываем прототип
  getLocalStorageData() {
    //   if(localStorage.)
    const data = JSON.parse(localStorage.getItem("workouts")); // Парсим из JSON в обьект
    console.log(data);

    if (data) {
      // Добавляем необходимый прототип
      data.forEach((el) => {
        el.__proto__ = el.cad ? Running.prototype : Cycling.prototype;
      });
      this.workOuts = data;
    }
  }

  // Обнуляем локальное хранилище
  static reset() {
    localStorage.removeItem("workouts", JSON.stringify(this.workOuts));
  }
}

// Инициальзируем приложение
const app = new App();

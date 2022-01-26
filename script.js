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

    this.loadMap().getPos();
    inputType.addEventListener("change", this.toggleElevationField.bind(this));
    form.addEventListener("submit", this.newWorkOut.bind(this));
    containerWorkouts.addEventListener("click", this.moveToMaker.bind(this));
  }

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

  loadMap() {
    this.map = L.map("map");
    L.tileLayer("http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(this.map);

    this.map.on("click", (mapE) => {
      this.mapEvent = mapE;
      this.showForm();
      inputDuration.value = inputDistance.value = "";
    });

    this.renderWorkOuts();
    this.workOuts.forEach(this.renderPopMaker.bind(this)); // RENDER ALL MARKERS

    return this;
  }

  showForm() {
    form.style.display = "grid";
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  hideForm() {
    form.style.display = "none";
    form.classList.add("hidden");
    inputElevation.value =
      inputDuration.value =
      inputDistance.value =
      inputCadence.value =
        "";
  }

  toggleElevationField() {
    inputElevation.parentElement.classList.toggle("form__row--hidden");
    inputCadence.parentElement.classList.toggle("form__row--hidden");

    this.isCycling = this.isCycling ? false : true;

    inputElevation.value = inputCadence.value = "";
    return this;
  }

  newWorkOut(e) {
    e.preventDefault();

    const validNum = (...inputs) => {
      return inputs.every((el) => Number.isFinite(el));
    };

    const isAllPositve = (...inputs) => {
      return inputs.every((el) => el >= 0);
    };

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

    const coords = [this.mapEvent?.latlng.lat, this.mapEvent?.latlng.lng];
    const params = [coords, dist, time];
    let currentWorkOut;
    if (this.isCycling) {
      currentWorkOut = new Cycling(...params, calc);
    }

    if (!this.isCycling) {
      currentWorkOut = new Running(...params, calc);
    }

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
    const type = work.constructor.name;
    // this.coords = [this.mapEvent.latlng.lat, this.mapEvent.latlng.lng];

    const workPopup = L.popup({
      className: `${type}-popup`,
      minWidth: 250,
      maxWidth: 100,
      autoClose: false,
      closeOnClick: false,
    });

    workPopup.setContent(
      `${type.toLowerCase() === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${type} on ${
        months[work.months]
      } ${work.day}`
    );
    L.marker(work.location).addTo(this.map).bindPopup(workPopup).openPopup();
  }

  moveToMaker(e) {
    const work = e.target.closest(".workout");
    if (work) {
      const workout = this.workOuts.find(
        (workout) => workout.id == work.dataset.id
      );
      this.map.flyTo(workout.location, 14);
    }
  }

  setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.workOuts));
  }
}

const app = new App();

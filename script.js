'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    (this.coords = coords),
      (this.distance = distance),
      (this.duration = duration);
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

//Application fucntionality
class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage(); // Fixed typo
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    }
  }

  _loadMap(position) {
    const lattitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const coords = [lattitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    // Only add markers after map is loaded
    this.#workouts.forEach(workout => {
      this.addMarkerToMap(workout);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    e.preventDefault();

    //Helper Functions
    const IsNumbers = inputs => inputs.every(i => Number.isFinite(i));
    const IsPositive = inputs => inputs.every(i => i > 0);

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type == 'running') {
      const cadence = +inputCadence.value;
      if (!IsNumbers([distance, duration, cadence])) {
        return alert('Distance and duration must be positive numbers');
      }
      if (!IsPositive([distance, duration, cadence])) {
        return alert('Distance and duration must be positive numbers');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type == 'cycling') {
      const elevation = +inputElevation.value;
      if (!IsNumbers([distance, duration, elevation])) {
        return alert('Distance and duration must be positive numbers');
      }
      if (!IsPositive([distance, duration])) {
        return alert('Distance and duration must be positive numbers');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //Add the object to a Workouts array
    this.#workouts.push(workout);

    //Add marker to the map
    this.addMarkerToMap(workout);
    //Clear form and hide it
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.classList.add('hidden');
    //Render the list
    this._renderWorkout(workout);
    this._setLocalStorage(); // Fixed typo
  }
  addMarkerToMap = function (workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        } ${workout.type[0].toUpperCase()}${workout.type.slice(1)} on ${
          months[workout.date.getMonth()]
        } ${workout.date.getDate()}`
      )
      .openPopup();
  };

  _renderWorkout(workout) {
    console.log(workout);
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">
        ${workout.type[0].toUpperCase()}${workout.type.slice(1)} on
        ${months[workout.date.getMonth()]} ${workout.date.getDate()}
        </h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    // Check if the click occurred on a workout list item
    const workoutEl = e.target.closest('.workout');

    // If no workout element is found, exit the function
    if (!workoutEl) return;

    // Find the workout object in the workouts array using its ID
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    // Use Leaflet's setView method to move the map to the workout's coordinates
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    // If there's no data, simply return
    if (!data) return;

    // Re-hydrate the objects to restore their prototype chains and convert date strings
    this.#workouts = data.map(workout => {
      // Convert the date string back into a Date object
      workout.date = new Date(workout.date);

      if (workout.type === 'running') {
        // Re-create a Running object
        const rehydratedWorkout = new Running(
          workout.coords,
          workout.distance,
          workout.duration,
          workout.cadence
        );
        // Manually set the date and id to match the original
        rehydratedWorkout.date = workout.date;
        rehydratedWorkout.id = workout.id;
        return rehydratedWorkout;
      }
      if (workout.type === 'cycling') {
        // Re-create a Cycling object
        const rehydratedWorkout = new Cycling(
          workout.coords,
          workout.distance,
          workout.duration,
          workout.elevationGain
        );
        // Manually set the date and id
        rehydratedWorkout.date = workout.date;
        rehydratedWorkout.id = workout.id;
        return rehydratedWorkout;
      }
    });

    // Render the workouts in the sidebar (map markers will be added in _loadMap)
    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
    });
  }
}
const app = new App();

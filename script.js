const ddlUnits         = document.querySelector("#ddlUnits");
const txtSearch        = document.querySelector("#txtSearch");
const btnSearch        = document.querySelector("#btnSearch");
const dvCityCountry    = document.querySelector("#dvCityCountry");
const dvCurrDate       = document.querySelector("#dvCurrDate");
const dvCurrTemp       = document.querySelector("#dvCurrTemp");
const pFeelsLike       = document.querySelector("#pFeelsLike");
const pHumidity        = document.querySelector("#pHumidity");
const pWind            = document.querySelector("#pWind");
const pPrecipitation   = document.querySelector("#pPrecipitation");
const pUVIndex         = document.querySelector("#pUVIndex");
const pUVLabel         = document.querySelector("#pUVLabel");
const pVisibility      = document.querySelector("#pVisibility");
const pSunrise         = document.querySelector("#pSunrise");
const pSunset          = document.querySelector("#pSunset");
const btnGeolocate     = document.querySelector("#btnGeolocate");

let cityName, countryName, weatherData;

// ========================
// PARTICLES
// ========================

const canvas  = document.querySelector("#particlesCanvas");
const ctx     = canvas.getContext("2d");
let particles = [];
let particleType = "stars"; // stars | rain | snow

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function createParticles(type) {
  particles = [];
  particleType = type;
  const count = type === "stars" ? 90 : type === "rain" ? 120 : 80;
  for (let i = 0; i < count; i++) {
    if (type === "stars") {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.3,
        alpha: Math.random() * 0.7 + 0.2,
        speed: Math.random() * 0.4 + 0.1,
        dir: Math.random() > 0.5 ? 1 : -1
      });
    } else if (type === "rain") {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        len: Math.random() * 18 + 8,
        speed: Math.random() * 6 + 8,
        alpha: Math.random() * 0.35 + 0.15
      });
    } else if (type === "snow") {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1.5,
        speed: Math.random() * 1.2 + 0.4,
        drift: (Math.random() - 0.5) * 0.6,
        alpha: Math.random() * 0.6 + 0.25
      });
    }
  }
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    ctx.save();
    if (particleType === "stars") {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.alpha += 0.008 * p.dir;
      if (p.alpha > 0.9 || p.alpha < 0.1) p.dir *= -1;
    } else if (particleType === "rain") {
      ctx.globalAlpha  = p.alpha;
      ctx.strokeStyle  = "rgba(140,190,255,0.8)";
      ctx.lineWidth    = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 1, p.y + p.len);
      ctx.stroke();
      p.y += p.speed;
      p.x += 1;
      if (p.y > canvas.height) { p.y = -p.len; p.x = Math.random() * canvas.width; }
    } else if (particleType === "snow") {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = "rgba(220,235,255,0.9)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.y += p.speed;
      p.x += p.drift;
      if (p.y > canvas.height) { p.y = -p.r; p.x = Math.random() * canvas.width; }
    }
    ctx.restore();
  });

  requestAnimationFrame(drawParticles);
}

createParticles("stars");
drawParticles();

// ========================
// WEATHER THEME
// ========================

function applyWeatherTheme(codeName) {
  const classes = [
    "weather--sunny","weather--partly-cloudy","weather--overcast",
    "weather--fog","weather--drizzle","weather--rain","weather--snow","weather--storm"
  ];
  document.body.classList.remove(...classes);
  document.body.classList.add(`weather--${codeName}`);

  if (codeName === "rain" || codeName === "drizzle") {
    if (particleType !== "rain") createParticles("rain");
  } else if (codeName === "snow") {
    if (particleType !== "snow") createParticles("snow");
  } else {
    if (particleType !== "stars") createParticles("stars");
  }
}

// ========================
// SKELETON LOADING
// ========================

function showSkeletons() {
  const els = [dvCurrTemp, pFeelsLike, pHumidity, pWind, pPrecipitation,
               pUVIndex, pVisibility, pSunrise, pSunset, dvCityCountry, dvCurrDate];
  els.forEach(el => { if (el) el.closest(".current__condition, .current__city, .current__date, .current__temp")?.classList.add("skeleton"); });
  [dvCityCountry, dvCurrDate].forEach(el => el?.parentElement?.classList.add("skeleton"));
}

function hideSkeletons() {
  document.querySelectorAll(".skeleton").forEach(el => el.classList.remove("skeleton"));
}

// ========================
// GEO DATA
// ========================

async function getGeoData() {
  const search = txtSearch.value.trim();
  if (!search) return;

  showSkeletons();

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=jsonv2&addressdetails=1`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    const result = await response.json();
    if (!result || result.length === 0) {
      alert("City not found. Please try again.");
      hideSkeletons();
      return;
    }
    loadLocationData(result);
    getWeatherData(result[0].lat, result[0].lon);
  } catch (error) {
    console.error(error.message);
    hideSkeletons();
  }
}

function loadLocationData(locationData) {
  const location = locationData[0].address;
  cityName = location.city || location.town || location.village ||
             location.county || location.state || locationData[0].display_name.split(",")[0];
  countryName = location.country_code ? location.country_code.toUpperCase() : "";

  const dateOptions = { year: "numeric", month: "short", day: "numeric", weekday: "long" };
  dvCityCountry.textContent = `${cityName}, ${countryName}`;
  dvCurrDate.textContent = new Intl.DateTimeFormat("en-US", dateOptions).format(new Date());
}

// ========================
// WEATHER DATA
// ========================

async function getWeatherData(lat, lon) {
  let tempUnit   = "celsius";
  let windUnit   = "kmh";
  let precipUnit = "mm";

  if (ddlUnits.value === "F") {
    tempUnit   = "fahrenheit";
    windUnit   = "mph";
    precipUnit = "inch";
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max` +
    `&hourly=temperature_2m,weather_code` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m,visibility` +
    `&wind_speed_unit=${windUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipUnit}&timezone=auto`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    weatherData = await response.json();

    hideSkeletons();
    loadCurrentWeather();
    loadDailyForecast();
    loadHourlyChart();
    animateTempUpdate();
  } catch (error) {
    console.error(error.message);
    hideSkeletons();
  }
}

// ========================
// CURRENT WEATHER
// ========================

function loadCurrentWeather() {
  dvCurrTemp.textContent     = Math.round(weatherData.current.temperature_2m);
  pFeelsLike.textContent     = Math.round(weatherData.current.apparent_temperature);
  pHumidity.textContent      = weatherData.current.relative_humidity_2m;
  pWind.textContent          = `${weatherData.current.wind_speed_10m} ${weatherData.current_units.wind_speed_10m.replace("mp/h", "mph")}`;
  pPrecipitation.textContent = `${weatherData.current.precipitation} ${weatherData.current_units.precipitation.replace("inch", "in")}`;

  // Visibility
  const vis = weatherData.current.visibility;
  if (pVisibility) pVisibility.textContent = vis != null ? (vis / 1000).toFixed(1) : "--";

  // UV Index
  const uv = weatherData.daily?.uv_index_max?.[0];
  if (pUVIndex) pUVIndex.textContent = uv != null ? uv.toFixed(1) : "--";
  if (pUVLabel && uv != null) {
    const { cls, label } = getUVInfo(uv);
    pUVLabel.textContent = label;
    pUVLabel.className   = `uv-label ${cls}`;
  }

  // Sunrise / Sunset
  if (pSunrise && weatherData.daily?.sunrise?.[0]) {
    pSunrise.textContent = formatTime(weatherData.daily.sunrise[0]);
  }
  if (pSunset && weatherData.daily?.sunset?.[0]) {
    pSunset.textContent = formatTime(weatherData.daily.sunset[0]);
  }

  // Theme + icon
  const codeName = getWeatherCodeName(weatherData.current.weather_code);
  applyWeatherTheme(codeName);

  const icon = document.querySelector(".current__icon");
  if (icon) {
    // ✅ مسار نسبي — يشتغل على GitHub Pages في أي subdirectory
    icon.src = `assets/images/icon-${codeName}.webp`;
    icon.alt = codeName;
  }
}

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function getUVInfo(uv) {
  if (uv <= 2)  return { cls: "uv-low",   label: "Low" };
  if (uv <= 5)  return { cls: "uv-mod",   label: "Moderate" };
  if (uv <= 7)  return { cls: "uv-high",  label: "High" };
  if (uv <= 10) return { cls: "uv-vhigh", label: "Very High" };
  return             { cls: "uv-ext",   label: "Extreme" };
}

// ========================
// TEMP ANIMATION
// ========================

function animateTempUpdate() {
  const tempWrap = dvCurrTemp?.parentElement;
  if (!tempWrap) return;
  tempWrap.classList.remove("temp-pop");
  void tempWrap.offsetWidth;
  tempWrap.classList.add("temp-pop");
  setTimeout(() => tempWrap.classList.remove("temp-pop"), 600);
}

// ========================
// HOURLY CHART
// ========================

function loadHourlyChart() {
  const chart = document.querySelector("#hourlyChart");
  if (!chart || !weatherData.hourly) return;

  chart.innerHTML = "";

  const now   = new Date();
  const times = weatherData.hourly.time;
  const temps = weatherData.hourly.temperature_2m;

  let startIdx = 0;
  for (let i = 0; i < times.length; i++) {
    if (new Date(times[i]) >= now) { startIdx = i; break; }
  }

  const slice = temps.slice(startIdx, startIdx + 24);
  const min   = Math.min(...slice);
  const max   = Math.max(...slice);
  const range = max - min || 1;

  for (let i = 0; i < slice.length; i++) {
    const idx  = startIdx + i;
    const time = new Date(times[idx]);
    const temp = slice[i];
    const pct  = ((temp - min) / range) * 70 + 15;

    const item = document.createElement("div");
    item.className = "hourly-item";

    const label = document.createElement("p");
    label.className = "hourly-time";
    label.textContent = time.getHours() === 0 ? "12am"
      : time.getHours() < 12 ? `${time.getHours()}am`
      : time.getHours() === 12 ? "12pm"
      : `${time.getHours() - 12}pm`;

    const barWrap = document.createElement("div");
    barWrap.className = "hourly-bar-wrap";

    const bar = document.createElement("div");
    bar.className = "hourly-bar";
    bar.style.height = "0%";
    barWrap.appendChild(bar);

    const tempLabel = document.createElement("p");
    tempLabel.className = "hourly-temp";
    tempLabel.textContent = `${Math.round(temp)}°`;

    item.appendChild(label);
    item.appendChild(barWrap);
    item.appendChild(tempLabel);
    chart.appendChild(item);

    setTimeout(() => { bar.style.height = `${pct}%`; }, 50 + i * 30);
  }
}

// ========================
// DAILY FORECAST
// ========================

function loadDailyForecast() {
  const daily = weatherData.daily;
  if (!daily || !daily.time) return;

  for (let i = 0; i < 7; i++) {
    const dvForecastDay = document.querySelector(`#dvForecastDay${i + 1}`);
    if (!dvForecastDay) continue;

    const date      = new Date(daily.time[i]);
    const dateFixed = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    const dayOfWeek = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(dateFixed);
    const codeName  = getWeatherCodeName(daily.weather_code[i]);
    const high      = Math.round(daily.temperature_2m_max[i]) + "°";
    const low       = Math.round(daily.temperature_2m_min[i]) + "°";

    dvForecastDay.innerHTML = "";
    addDailyElement("p",   "daily__day-title", dayOfWeek, "", dvForecastDay, "afterbegin");
    addDailyElement("img", "daily__day-icon",  "", codeName, dvForecastDay, "beforeend");
    addDailyElement("div", "daily__day-temps", "", "", dvForecastDay, "beforeend");

    const dvTemps = dvForecastDay.querySelector(".daily__day-temps");
    if (dvTemps) {
      addDailyElement("p", "daily__day-high", high, "", dvTemps, "afterbegin");
      addDailyElement("p", "daily__day-low",  low,  "", dvTemps, "beforeend");
    }
  }
}

function addDailyElement(tag, className, content, codeName, parent, position) {
  const el = document.createElement(tag);
  el.setAttribute("class", className);
  if (content) el.appendChild(document.createTextNode(content));
  if (tag === "img") {
    // ✅ مسار نسبي — يشتغل على GitHub Pages في أي subdirectory
    el.setAttribute("src",    `assets/images/icon-${codeName}.webp`);
    el.setAttribute("alt",    codeName);
    el.setAttribute("width",  "28");
    el.setAttribute("height", "28");
  }
  parent.insertAdjacentElement(position, el);
}

// ========================
// WEATHER CODE → NAME
// ========================

function getWeatherCodeName(code) {
  const map = {
    0: "sunny", 1: "partly-cloudy", 2: "partly-cloudy", 3: "overcast",
    45: "fog", 48: "fog",
    51: "drizzle", 53: "drizzle", 55: "drizzle", 56: "drizzle", 57: "drizzle",
    61: "rain", 63: "rain", 65: "rain", 66: "rain", 67: "rain",
    80: "rain", 81: "rain", 82: "rain",
    71: "snow", 73: "snow", 75: "snow", 77: "snow", 85: "snow", 86: "snow",
    95: "storm", 96: "storm", 99: "storm"
  };
  return map[code] || "sunny";
}

// ========================
// GEOLOCATION
// ========================

if (btnGeolocate) {
  btnGeolocate.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    btnGeolocate.classList.add("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        btnGeolocate.classList.remove("locating");

        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1`);
          const data = await res.json();
          const addr = data.address;
          cityName    = addr.city || addr.town || addr.village || addr.county || addr.state || "Your Location";
          countryName = addr.country_code ? addr.country_code.toUpperCase() : "";
          const dateOptions = { year: "numeric", month: "short", day: "numeric", weekday: "long" };
          dvCityCountry.textContent = `${cityName}, ${countryName}`;
          dvCurrDate.textContent    = new Intl.DateTimeFormat("en-US", dateOptions).format(new Date());
          txtSearch.value = cityName;
        } catch (e) {
          dvCityCountry.textContent = "Your Location";
        }

        showSkeletons();
        getWeatherData(lat, lon);
      },
      () => {
        btnGeolocate.classList.remove("locating");
        alert("Could not get your location. Please allow location access.");
      }
    );
  });
}

// ========================
// EVENTS
// ========================

btnSearch.addEventListener("click", getGeoData);

txtSearch.addEventListener("keydown", (e) => {
  if (e.key === "Enter") getGeoData();
});

ddlUnits.addEventListener("change", getGeoData);

// Load default city on start
getGeoData();
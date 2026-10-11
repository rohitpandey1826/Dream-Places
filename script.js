/* ==========================================

   DREAM PLACES — SCRIPT.JS

   Multi-stop Google Maps routes

   Unique destination progress

   Synchronized visited status

\========================================== */





/* ==========================================

   DOM ELEMENTS

\========================================== */



const categoriesContainer = document.getElementById("categories");

const searchInput = document.getElementById("searchInput");

const progressFill = document.getElementById("progressFill");

const progressText = document.getElementById("progressText");

const totalPlaces = document.getElementById("totalPlaces");

const visitedPlaces = document.getElementById("visitedPlaces");

const remainingPlaces = document.getElementById("remainingPlaces");

const scrollTopBtn = document.getElementById("scrollTop");

const progressBar = document.getElementById("progressBar");





/* ==========================================

   FILTER STATE

\========================================== */



let statusFilter = "all";





/* ==========================================

   UNIQUE PLACE KEY

\========================================== */



function getPlaceKey(place) {

    return place.name

        .trim()

        .toLowerCase()

        .replace(/\s+/g, " ");

}





/* ==========================================

   GET UNIQUE DESTINATIONS

\========================================== */



function getUniquePlaces() {

    const uniquePlaces = new Map();



    placesData.forEach(category => {

        category.places.forEach(place => {

            const key = getPlaceKey(place);



            if (!uniquePlaces.has(key)) {

                uniquePlaces.set(key, place);

            }

        });

    });



    return uniquePlaces;

}





/* ==========================================

   LOAD AND MIGRATE SAVED DATA

\========================================== */



let visited = {};



try {

    const savedData = JSON.parse(

        localStorage.getItem("dreamPlaces")

    );



    if (

        savedData &&

        typeof savedData === "object" &&

        !Array.isArray(savedData)

    ) {

        // Preserve existing name-based saved statuses.

        Object.keys(savedData).forEach(key => {

            if (

                !/^\d+-\d+$/.test(key) &&

                savedData[key] === true

            ) {

                visited[key] = true;

            }

        });



        // Migrate old category-index/place-index keys.

        placesData.forEach((category, categoryIndex) => {

            category.places.forEach((place, placeIndex) => {

                const oldKey = `${categoryIndex}-${placeIndex}`;



                if (savedData[oldKey] === true) {

                    visited[getPlaceKey(place)] = true;

                }

            });

        });



        localStorage.setItem(

            "dreamPlaces",

            JSON.stringify(visited)

        );

    }

} catch (error) {

    console.warn("Unable to load saved progress:", error);

}





/* ==========================================

   SAVE DATA

\========================================== */



function saveData() {

    try {

        localStorage.setItem(

            "dreamPlaces",

            JSON.stringify(visited)

        );

    } catch (error) {

        console.error("Unable to save progress:", error);

        alert("Progress could not be saved in this browser.");

    }

}





/* ==========================================

   CHECK PLACE STATUS

\========================================== */



function isPlaceVisited(place) {

    return visited[getPlaceKey(place)] === true;

}





/* ==========================================

   TOGGLE PLACE STATUS

\========================================== */



function togglePlace(place) {

    const key = getPlaceKey(place);



    visited[key] = !isPlaceVisited(place);



    saveData();



    renderCategories(

        searchInput.value.trim().toLowerCase()

    );



    checkCompletion();

}





/* ==========================================

   GOOGLE MAPS MULTI-STOP ROUTE



   Starts from the user's current location

   by omitting the origin parameter.



   Stops follow the order in data.js.

\========================================== */



function openCategoryRoute(category) {

    const places = category.places;



    if (!places || places.length === 0) {

        alert("There are no destinations in this category.");

        return;

    }



    /*

       Google Maps Directions URLs support

       a limited number of waypoints.



       This route uses a maximum of:

       - 1 destination

       - 9 intermediate waypoints



       That means up to 10 category destinations

       can be included in one route.

    */



    const maxStops = 10;



    const routePlaces = places.slice(0, maxStops);



    const destinationPlace =

        routePlaces[routePlaces.length - 1];



    const destination = encodeURIComponent(

        destinationPlace.name + ", " + destinationPlace.location

    );



    const waypoints = routePlaces

        .slice(0, -1)

        .map(place =>

            encodeURIComponent(

                place.name + ", " + place.location

            )

        )

        .join("%7C");



    /*

       No origin is specified.

       Google Maps can use the current location

       when the user permits location access.

    */



    let mapsURL =

        "https://www.google.com/maps/dir/?api=1" +

        "&destination=" + destination +

        "&travelmode=driving";



    if (waypoints) {

        mapsURL += "&waypoints=" + waypoints;

    }



    // Open Maps directly from the user's click.

    window.open(

        mapsURL,

        "\_blank",

        "noopener,noreferrer"

    );



    if (places.length > maxStops) {

        alert(

            "This category contains " + places.length +

            " destinations.\n\n" +

            "Google Maps route URLs have waypoint limits, " +

            "so this route includes the first " + maxStops +

            " destinations in the category.\n\n" +

            "The remaining destinations will need additional " +

            "route segments."

        );

    }

}





/* ==========================================

   SEARCH

\========================================== */



searchInput.addEventListener("input", () => {

    renderCategories(

        searchInput.value.trim().toLowerCase()

    );

});





/* ==========================================

   CLICKABLE DASHBOARD CARDS

\========================================== */



function setupDashboardCards() {

    const totalCard = totalPlaces.closest(".card");

    const visitedCard = visitedPlaces.closest(".card");

    const remainingCard = remainingPlaces.closest(".card");



    function makeClickable(card, label, filter) {

        if (!card) return;



        card.style.cursor = "pointer";

        card.style.transition = "transform 0.2s ease";

        card.title = label;

        card.setAttribute("role", "button");

        card.setAttribute("tabindex", "0");



        function activate() {

            statusFilter = filter;



            renderCategories(

                searchInput.value.trim().toLowerCase()

            );



            document.getElementById("explore")?.scrollIntoView({

                behavior: "smooth",

                block: "start"

            });

        }



        card.addEventListener("click", activate);



        card.addEventListener("keydown", event => {

            if (event.key === "Enter" || event.key === " ") {

                event.preventDefault();

                activate();

            }

        });



        card.addEventListener("mouseenter", () => {

            card.style.transform = "translateY(-5px)";

        });



        card.addEventListener("mouseleave", () => {

            card.style.transform = "translateY(0)";

        });

    }



    makeClickable(totalCard, "Show all destinations", "all");

    makeClickable(visitedCard, "Show visited destinations", "visited");

    makeClickable(remainingCard, "Show remaining destinations", "remaining");

}





/* ==========================================

   RENDER CATEGORIES

\========================================== */



function renderCategories(search = "") {

    categoriesContainer.innerHTML = "";



    /* ---------- FILTER NOTICE ---------- */



    if (statusFilter !== "all") {

        const notice = document.createElement("div");



        notice.style.cssText = `

            display:flex;

            justify-content:space-between;

            align-items:center;

            gap:12px;

            flex-wrap:wrap;

            padding:14px 18px;

            margin-bottom:18px;

            border:1px solid rgba(197,154,76,0.5);

            border-radius:12px;

            background:rgba(197,154,76,0.12);

        `;



        const message = document.createElement("span");



        message.textContent = statusFilter === "visited"

            ? "✓ Showing visited destinations"

            : "○ Showing destinations not yet visited";



        const resetButton = document.createElement("button");

        resetButton.type = "button";

        resetButton.textContent = "Show All";



        resetButton.style.cssText = `

            padding:9px 16px;

            border:0;

            border-radius:8px;

            cursor:pointer;

            font:inherit;

        `;



        resetButton.addEventListener("click", () => {

            statusFilter = "all";



            renderCategories(

                searchInput.value.trim().toLowerCase()

            );

        });



        notice.appendChild(message);

        notice.appendChild(resetButton);

        categoriesContainer.appendChild(notice);

    }



    let visiblePlaceCount = 0;



    placesData.forEach((category, categoryIndex) => {

        const categoryCard = document.createElement("div");

        categoryCard.className = "category";



        /* ---------- CATEGORY HEADER ---------- */



        const header = document.createElement("div");

        header.className = "category-header";



        const title = document.createElement("h2");



        const titleText = document.createElement("span");

        titleText.textContent = category.title;



        const arrow = document.createElement("span");

        arrow.className = "arrow";

        arrow.textContent = "▼";



        title.appendChild(titleText);

        title.appendChild(arrow);



        const categoryProgress = document.createElement("div");

        categoryProgress.className = "category-progress";



        header.appendChild(title);

        header.appendChild(categoryProgress);



        /* ---------- CATEGORY MAPS BUTTON ---------- */



        const categoryMapButton = document.createElement("button");



        categoryMapButton.type = "button";

        categoryMapButton.className = "map-btn category-map-btn";

        categoryMapButton.textContent = "🗺 Explore Full Route";

        categoryMapButton.style.cssText = `

            margin:12px 16px 0;

            border:0;

            cursor:pointer;

            font:inherit;

        `;



        categoryMapButton.addEventListener("click", event => {

            event.stopPropagation();

            openCategoryRoute(category);

        });



        /* ---------- PLACE LIST ---------- */



        const list = document.createElement("div");

        list.className = "place-list";



        let completed = 0;

        const total = category.places.length;

        let visibleInCategory = 0;



        category.places.forEach(place => {

            const key = getPlaceKey(place);

            const placeVisited = isPlaceVisited(place);



            if (placeVisited) {

                completed++;

            }



            /* Search filter */



            const keyword = (

                place.name + " " + place.location

            ).toLowerCase();



            if (search && !keyword.includes(search)) {

                return;

            }



            /* Dashboard status filter */



            if (statusFilter === "visited" && !placeVisited) {

                return;

            }



            if (statusFilter === "remaining" && placeVisited) {

                return;

            }



            visibleInCategory++;

            visiblePlaceCount++;



            /* ---------- PLACE ROW ---------- */



            const item = document.createElement("div");

            item.className = "place-item";

            item.style.cursor = "pointer";



            const left = document.createElement("div");

            left.className = "place-left";



            /* Checkbox */



            const checkbox = document.createElement("input");

            checkbox.type = "checkbox";

            checkbox.checked = placeVisited;



            checkbox.setAttribute(

                "aria-label",

                `Mark ${place.name} as visited`

            );



            /* Name and location */



            const info = document.createElement("div");

            info.className = "place-info";



            const placeName = document.createElement("h4");

            placeName.textContent = place.name;



            if (placeVisited) {

                placeName.classList.add("completed");

            }



            const location = document.createElement("p");

            location.textContent = place.location;



            info.appendChild(placeName);

            info.appendChild(location);



            left.appendChild(checkbox);

            left.appendChild(info);



            /* Individual Maps button:

               also opens the full category route. */



            const mapButton = document.createElement("a");

            mapButton.className = "map-btn";

            mapButton.textContent = "🗺 Maps";



            mapButton.href = "#";



            mapButton.setAttribute(

                "aria-label",

                `Open the full ${category.title} route`

            );



            mapButton.addEventListener("click", event => {

                event.preventDefault();

                event.stopPropagation();



                openCategoryRoute(category);

            });



            /* Click entire row */



            item.addEventListener("click", event => {

                if (

                    event.target.closest(".map-btn") ||

                    event.target === checkbox

                ) {

                    return;

                }



                togglePlace(place);

            });



            /* Checkbox change */



            checkbox.addEventListener("change", () => {

                visited[key] = checkbox.checked;



                saveData();



                renderCategories(

                    searchInput.value.trim().toLowerCase()

                );



                checkCompletion();

            });



            item.appendChild(left);

            item.appendChild(mapButton);



            list.appendChild(item);

        });



        /* ---------- CATEGORY PROGRESS ---------- */



        categoryProgress.textContent =

            `${completed} / ${total}`;



        /* ---------- ACCORDION ---------- */



        header.addEventListener("click", () => {

            const wasOpen =

                categoryCard.classList.contains("open");



            document.querySelectorAll(".category").forEach(card => {

                card.classList.remove("open");



                card.querySelector(".arrow")

                    ?.classList.remove("rotate");

            });



            if (!wasOpen) {

                categoryCard.classList.add("open");

                arrow.classList.add("rotate");

            }

        });



        categoryCard.appendChild(header);

        categoryCard.appendChild(categoryMapButton);

        categoryCard.appendChild(list);



        if (visibleInCategory > 0) {

            categoriesContainer.appendChild(categoryCard);



            if (search || statusFilter !== "all") {

                categoryCard.classList.add("open");

                arrow.classList.add("rotate");

            }

        }

    });



    /* ---------- NO RESULTS ---------- */



    if (visiblePlaceCount === 0) {

        const emptyMessage = document.createElement("p");



        emptyMessage.textContent =

            "No destinations match your selection.";



        emptyMessage.style.cssText = `

            text-align:center;

            padding:30px 16px;

        `;



        categoriesContainer.appendChild(emptyMessage);

    }



    updateProgress();

}





/* ==========================================

   UNIQUE DESTINATION PROGRESS

\========================================== */



function updateProgress() {

    const uniquePlaces = getUniquePlaces();



    const total = uniquePlaces.size;

    let completed = 0;



    uniquePlaces.forEach(place => {

        if (isPlaceVisited(place)) {

            completed++;

        }

    });



    const remaining = total - completed;



    const percentage = total === 0

        ? 0

        : Math.round((completed / total) * 100);



    totalPlaces.textContent = total;

    visitedPlaces.textContent = completed;

    remainingPlaces.textContent = remaining;



    progressText.textContent =

        `${completed} / ${total} Completed (${percentage}%)`;



    progressFill.style.width = `${percentage}%`;



    if (progressBar) {

        progressBar.setAttribute(

            "aria-valuenow",

            percentage

        );

    }

}





/* ==========================================

   COMPLETION ALERT

\========================================== */



let congratulationsShown = false;



function checkCompletion() {

    const uniquePlaces = getUniquePlaces();



    const total = uniquePlaces.size;

    let completed = 0;



    uniquePlaces.forEach(place => {

        if (isPlaceVisited(place)) {

            completed++;

        }

    });



    if (total > 0 && completed === total) {

        if (!congratulationsShown) {

            congratulationsShown = true;



            setTimeout(() => {

                alert(

                    "🎉 Congratulations!\n\n" +

                    "You have completed your Dream Places Bucket List!"

                );

            }, 300);

        }

    } else {

        congratulationsShown = false;

    }

}





/* ==========================================

   SCROLL TO TOP

\========================================== */



window.addEventListener("scroll", () => {

    scrollTopBtn.style.display =

        window.scrollY > 250 ? "flex" : "none";

});



scrollTopBtn.addEventListener("click", () => {

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

});





/* ==========================================

   KEYBOARD SHORTCUT

\========================================== */



document.addEventListener("keydown", event => {

    if (

        event.key === "/" &&

        !event.ctrlKey &&

        !event.metaKey &&

        !event.altKey

    ) {

        const active = document.activeElement;

        const tag = active?.tagName;



        if (

            tag === "INPUT" ||

            tag === "TEXTAREA" ||

            active?.isContentEditable

        ) {

            return;

        }



        event.preventDefault();

        searchInput.focus();

    }

});





/* ==========================================

   INITIALIZE

\========================================== */



function setupPlannerToggle() {
    const toggle = document.getElementById("plannerToggle");
    const planner = document.getElementById("tripPlanner");

    if (!toggle || !planner) return;

    toggle.addEventListener("click", () => {
        const isOpening = toggle.getAttribute("aria-expanded") !== "true";
        toggle.setAttribute("aria-expanded", String(isOpening));
        planner.hidden = !isOpening;
    });
}

function init() {

    setupPlannerToggle();
    populateTripPlaces();

    setupDashboardCards();

    renderCategories();

    checkCompletion();



    console.log("🌍 Dream Places loaded successfully!");

}





/* ==========================================

   PAGE LOAD

\========================================== */



if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", init);

} else {

    init();

}


/* ==========================================
   FULL-ROUTE SPIRITUAL DISCOVERY PLANNER
   Uses OpenStreetMap Photon geocoding + OSRM routing.
   Results are route-corridor estimates, not a live navigation guarantee.
========================================== */
const tripForm = document.getElementById("tripForm");
const tripStartInput = document.getElementById("tripStart");
const tripDestinationInput = document.getElementById("tripDestination");
const tripDurationSelect = document.getElementById("tripDuration");
const tripPlacesList = document.getElementById("tripPlaces");
const tripResults = document.getElementById("tripResults");

const TRIP_GEO_CACHE_KEY = "dreamPlacesGeoCacheV2";
const PHOTON_ENDPOINT = "https://photon.komoot.io/api/";
const OSRM_ENDPOINT = "https://router.project-osrm.org/route/v1/driving/";

function normalizeRouteText(value) {
    return String(value || "").toLowerCase().replace(/[()—–]/g, " ").replace(/[^a-z0-9, ]/g, " ").replace(/\s+/g, " ").trim();
}

function getGeoCache() {
    try { return JSON.parse(localStorage.getItem(TRIP_GEO_CACHE_KEY) || "{}"); }
    catch { return {}; }
}

function saveGeoCache(cache) {
    try { localStorage.setItem(TRIP_GEO_CACHE_KEY, JSON.stringify(cache)); }
    catch (error) { console.warn("Could not save route geocoding cache", error); }
}

function populateTripPlaces() {
    if (!tripPlacesList || !Array.isArray(placesData)) return;
    const options = new Map();
    placesData.forEach(category => (category.places || []).forEach(place => {
        const label = `${place.name}, ${place.location}`;
        const key = normalizeRouteText(label);
        if (!options.has(key)) options.set(key, label);
    }));
    ["Pune, Maharashtra, India", "Mumbai, Maharashtra, India", "Delhi, India", "Kedarnath, Rudraprayag, Uttarakhand, India", "Kashi Vishwanath, Varanasi, Uttar Pradesh, India", "Mahakaleshwar, Ujjain, Madhya Pradesh, India", "Haridwar, Uttarakhand, India", "Rishikesh, Uttarakhand, India"].forEach(label => {
        const key = normalizeRouteText(label);
        if (!options.has(key)) options.set(key, label);
    });
    tripPlacesList.innerHTML = "";
    [...options.values()].sort((a,b) => a.localeCompare(b)).forEach(label => {
        const option = document.createElement("option");
        option.value = label;
        tripPlacesList.appendChild(option);
    });
}

async function geocodePlace(query, cache) {
    const key = normalizeRouteText(query);
    if (cache[key]) return cache[key];
    const url = `${PHOTON_ENDPOINT}?q=${encodeURIComponent(query)}&limit=1&lang=en`;
    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!response.ok) throw new Error(`Geocoding service returned ${response.status}`);
    const data = await response.json();
    const feature = data.features && data.features[0];
    if (!feature || !feature.geometry || !feature.geometry.coordinates) return null;
    const [lon, lat] = feature.geometry.coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const result = { lat, lon };
    cache[key] = result;
    saveGeoCache(cache);
    return result;
}

function pointToSegmentDistanceKm(point, a, b) {
    const latScale = 111.32;
    const lonScale = 111.32 * Math.cos(point.lat * Math.PI / 180);
    const px = point.lon * lonScale, py = point.lat * latScale;
    const ax = a[0] * lonScale, ay = a[1] * latScale;
    const bx = b[0] * lonScale, by = b[1] * latScale;
    const dx = bx - ax, dy = by - ay;
    const denominator = dx * dx + dy * dy;
    const t = denominator ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / denominator)) : 0;
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function distanceFromRouteKm(point, coordinates) {
    let minimum = Infinity;
    // Inspect every 3rd geometry point for speed, plus the final point.
    for (let i = 0; i < coordinates.length - 1; i += 3) {
        const next = coordinates[Math.min(i + 3, coordinates.length - 1)];
        minimum = Math.min(minimum, pointToSegmentDistanceKm(point, coordinates[i], next));
    }
    if (coordinates.length > 1) {
        minimum = Math.min(minimum, pointToSegmentDistanceKm(point, coordinates[coordinates.length - 2], coordinates[coordinates.length - 1]));
    }
    return minimum;
}

function classifyRouteDistance(km) {
    if (km <= 20) return { type: "route", label: "NEAR THE ROUTE" };
    if (km <= 80) return { type: "detour", label: "SMALL / MODERATE DETOUR" };
    return { type: "major", label: "MAJOR DETOUR" };
}

function uniqueTripPlaces() {
    const seen = new Set();
    const list = [];
    placesData.forEach(category => (category.places || []).forEach(place => {
        const key = normalizeRouteText(`${place.name}|${place.location}`);
        if (!seen.has(key)) {
            seen.add(key);
            list.push({ name: place.name, location: place.location, key });
        }
    }));
    return list;
}

function setTripProgress(message) {
    if (!tripResults) return;
    tripResults.innerHTML = "";
    const box = document.createElement("div");
    box.className = "planner-empty";
    const icon = document.createElement("i");
    icon.className = "fa-solid fa-route";
    const text = document.createElement("span");
    text.textContent = message;
    box.append(icon, text);
    tripResults.appendChild(box);
}

async function calculateFullRoute(start, destination, days) {
    const cache = getGeoCache();
    setTripProgress("Finding the route and checking your saved temple list against the full journey. First-time searches may take a little longer while locations are looked up.");

    const [originPoint, destinationPoint] = await Promise.all([
        geocodePlace(start, cache),
        geocodePlace(destination, cache)
    ]);
    if (!originPoint || !destinationPoint) throw new Error("Could not locate the start or destination. Try adding the city, state and country.");

    const routeUrl = `${OSRM_ENDPOINT}${originPoint.lon},${originPoint.lat};${destinationPoint.lon},${destinationPoint.lat}?overview=full&geometries=geojson&steps=false`;
    const routeResponse = await fetch(routeUrl);
    if (!routeResponse.ok) throw new Error("The road-routing service is temporarily unavailable. Please try again.");
    const routeData = await routeResponse.json();
    if (routeData.code !== "Ok" || !routeData.routes || !routeData.routes[0]) throw new Error("No driving route was found for these locations.");
    const route = routeData.routes[0];
    const geometry = route.geometry.coordinates;
    const candidates = uniqueTripPlaces().filter(place => {
        const combined = normalizeRouteText(`${place.name} ${place.location}`);
        return !combined.includes(normalizeRouteText(destination)) && !combined.includes(normalizeRouteText(start));
    });

    const locations = new Map();
    candidates.forEach(place => {
        const locationKey = normalizeRouteText(place.location);
        if (!locations.has(locationKey)) locations.set(locationKey, { query: `${place.location}, India`, places: [] });
        locations.get(locationKey).places.push(place);
    });
    const locationEntries = [...locations.entries()];
    const results = [];
    let completed = 0;
    const concurrency = 4;
    let nextIndex = 0;
    async function worker() {
        while (nextIndex < locationEntries.length) {
            const index = nextIndex++;
            const [locationKey, entry] = locationEntries[index];
            try {
                let point = cache[normalizeRouteText(entry.query)];
                if (!point) {
                    // Photon is a public community geocoder; use modest concurrency and cache responses.
                    point = await geocodePlace(entry.query, cache);
                }
                if (point) {
                    const km = distanceFromRouteKm(point, geometry);
                    // Show route-adjacent places and meaningful detours up to 250 km.
                    if (km <= 250) entry.places.forEach(place => results.push({ ...place, km, point }));
                }
            } catch (error) {
                console.warn("Skipping location during route scan:", entry.query, error);
            }
            completed++;
            if (completed % 5 === 0 || completed === locationEntries.length) {
                setTripProgress(`Scanning your full route… checked ${completed} of ${locationEntries.length} location areas. Please keep this page open.`);
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, locationEntries.length) }, worker));
    results.sort((a, b) => a.km - b.km || a.name.localeCompare(b.name));
    return { results, routeKm: route.distance / 1000, routeHours: route.duration / 3600, days, scanned: locationEntries.length };
}

function renderFullRouteResults(start, destination, plan) {
    tripResults.innerHTML = "";
    const summary = document.createElement("div");
    summary.className = "trip-summary";
    const summaryText = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = `${start} → ${destination}`;
    const sub = document.createElement("p");
    sub.textContent = `Road route estimate: ${Math.round(plan.routeKm)} km · about ${Math.round(plan.routeHours * 10) / 10} hours driving without long stops · ${plan.days}-day trip plan`;
    summaryText.append(heading, sub);
    summary.appendChild(summaryText);
    tripResults.appendChild(summary);

    if (!plan.results.length) {
        const empty = document.createElement("div");
        empty.className = "planner-empty";
        empty.textContent = "No saved destinations matched the route corridor. Try a wider journey or check that place names and locations are specific.";
        tripResults.appendChild(empty);
    } else {
        const intro = document.createElement("p");
        intro.className = "trip-notice";
        intro.textContent = `Found ${plan.results.length} saved destination entries within 250 km of the calculated route. Stops are grouped using the location's city/region coordinate, so the detour distance is approximate. Select the places you want to add.`;
        tripResults.appendChild(intro);
        const list = document.createElement("div");
        list.className = "trip-stop-list";
        plan.results.forEach((place, index) => {
            const classification = classifyRouteDistance(place.km);
            const row = document.createElement("article");
            row.className = "trip-stop";
            const number = document.createElement("div");
            number.className = "trip-stop-number";
            number.textContent = String(index + 1);
            const info = document.createElement("div");
            const name = document.createElement("h4");
            name.textContent = place.name;
            const location = document.createElement("p");
            location.textContent = place.location;
            const distance = document.createElement("p");
            distance.textContent = `Approx. ${Math.round(place.km)} km from the route corridor`;
            const tag = document.createElement("span");
            tag.className = `stop-tag ${classification.type}`;
            tag.textContent = classification.label;
            info.append(name, location, distance, tag);
            const checkLabel = document.createElement("label");
            checkLabel.className = "stop-check";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.dataset.routeStop = "true";
            checkbox.dataset.place = `${place.name}, ${place.location}`;
            checkbox.setAttribute("aria-label", `Include ${place.name} in route`);
            checkLabel.append(checkbox, document.createTextNode("Include stop"));
            row.append(number, info, checkLabel);
            list.appendChild(row);
        });
        tripResults.appendChild(list);
    }

    const notice = document.createElement("div");
    notice.className = "trip-notice";
    notice.textContent = "This is route-corridor discovery, not turn-by-turn navigation. City-level location data can make some distances approximate. The actual road route, traffic, weather, seasonal temple access and trekking requirements must be checked before travel.";
    tripResults.appendChild(notice);

    const actions = document.createElement("div");
    actions.className = "trip-actions";

    // Google Maps URLs have a platform-dependent waypoint limit. Use small
    // connected car-route segments so every selected stop is retained on mobile too.
    const selected = [...tripResults.querySelectorAll('input[data-route-stop="true"]:checked')]
        .map(input => input.dataset.place);
    const segmentLinks = document.createElement("div");
    segmentLinks.className = "car-route-segments";
    const segmentHeading = document.createElement("h4");
    segmentHeading.innerHTML = '<i class="fa-solid fa-car-side"></i> Car route in Google Maps';
    segmentLinks.appendChild(segmentHeading);

    function googleCarUrl(origin, end, stops) {
        let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(end)}&travelmode=driving`;
        if (stops.length) url += `&waypoints=${stops.map(encodeURIComponent).join("%7C")}`;
        return url;
    }

    if (selected.length <= 3) {
        const link = document.createElement("a");
        link.href = googleCarUrl(start, destination, selected);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "planner-map-btn";
        link.innerHTML = '<i class="fa-solid fa-car-side"></i> Open Car Route';
        segmentLinks.appendChild(link);
    } else {
        const info = document.createElement("p");
        info.className = "trip-notice";
        info.textContent = `You selected ${selected.length} stops. To work reliably on phones, the car journey is split into connected segments of up to 3 intermediate stops. Open them in order.`;
        segmentLinks.appendChild(info);

        // Keep the full journey connected: each segment's destination is the
        // next segment's origin. Every selected stop appears exactly once.
        const chunks = [];
        for (let i = 0; i < selected.length; i += 3) chunks.push(selected.slice(i, i + 3));
        let segmentOrigin = start;
        chunks.forEach((chunk, index) => {
            const isLast = index === chunks.length - 1;
            // Intermediate segments end at their chunk's last stop. The final
            // segment starts at the previous endpoint and includes every stop
            // in its chunk as waypoints before reaching the main destination.
            const segmentDestination = isLast ? destination : chunk[chunk.length - 1];
            const intermediateStops = isLast ? chunk : chunk.slice(0, -1);
            const link = document.createElement("a");
            link.href = googleCarUrl(segmentOrigin, segmentDestination, intermediateStops);
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.className = "planner-map-btn";
            link.innerHTML = `<i class="fa-solid fa-car-side"></i> Open Car Route Segment ${index + 1} of ${chunks.length}`;
            segmentLinks.appendChild(link);
            segmentOrigin = segmentDestination;
        });
    }

    const directLink = document.createElement("a");
    directLink.href = googleCarUrl(start, destination, []);
    directLink.target = "_blank";
    directLink.rel = "noopener noreferrer";
    directLink.className = "planner-map-btn planner-secondary";
    directLink.innerHTML = '<i class="fa-solid fa-car"></i> Direct Car Route (No Stops)';
    actions.append(segmentLinks, directLink);
    tripResults.appendChild(actions);
}

if (tripForm) {
    tripForm.addEventListener("submit", async event => {
        event.preventDefault();
        const start = tripStartInput.value.trim();
        const destination = tripDestinationInput.value.trim();
        const days = Number(tripDurationSelect.value) || 5;
        if (!start || !destination) {
            setTripProgress("Please enter both a starting point and a destination.");
            return;
        }
        const submitButton = tripForm.querySelector('button[type="submit"]');
        if (submitButton) { submitButton.disabled = true; submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Scanning route…'; }
        try {
            const plan = await calculateFullRoute(start, destination, days);
            renderFullRouteResults(start, destination, plan);
        } catch (error) {
            console.error("Route planner error:", error);
            setTripProgress(`${error.message || "Could not calculate this route."} Check your internet connection and try again. The planner uses public OpenStreetMap services, which may occasionally be unavailable.`);
        } finally {
            if (submitButton) { submitButton.disabled = false; submitButton.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Find Spiritual Stops'; }
        }
    });
}

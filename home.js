// =========================================
// SAKINAH HOME PAGE
// =========================================

document.addEventListener("DOMContentLoaded", async () => {


    // =========================================
    // DOM ELEMENTS
    // =========================================

    const protectionStatus =
        document.getElementById(
            "protectionStatus"
        );

    const protectionDescription =
        document.getElementById(
            "protectionDescription"
        );

    const statusIndicator =
        document.getElementById(
            "statusIndicator"
        );

    const filterStatuses =
        document.querySelectorAll(
            ".filter-status"
        );

    const blockedSitesList =
        document.getElementById(
            "blockedSitesList"
        );


    // Prayer elements

    const prayerLocation =
        document.getElementById(
            "prayerLocation"
        );

    const changeLocationButton =
        document.getElementById(
            "changeLocationButton"
        );

    const locationPanel =
        document.getElementById(
            "locationPanel"
        );

    const locationSearch =
        document.getElementById(
            "locationSearch"
        );

    const searchLocationButton =
        document.getElementById(
            "searchLocationButton"
        );

    const locationSearchStatus =
        document.getElementById(
            "locationSearchStatus"
        );

    const locationResults =
        document.getElementById(
            "locationResults"
        );


    const fajrTime =
        document.getElementById(
            "fajrTime"
        );

    const dhuhrTime =
        document.getElementById(
            "dhuhrTime"
        );

    const asrTime =
        document.getElementById(
            "asrTime"
        );

    const maghribTime =
        document.getElementById(
            "maghribTime"
        );

    const ishaTime =
        document.getElementById(
            "ishaTime"
        );


    const nextPrayer =
        document.getElementById(
            "nextPrayer"
        );

    const nextPrayerTime =
        document.getElementById(
            "nextPrayerTime"
        );

    const nextPrayerCountdown =
        document.getElementById(
            "nextPrayerCountdown"
        );


    const calculationMethod =
        document.getElementById(
            "calculationMethod"
        );

    const madhab =
        document.getElementById(
            "madhab"
        );


    // =========================================
    // PRAYER CONFIGURATION
    // =========================================

    const DEFAULT_PRAYER_SETTINGS = {

        calculationMethod:
            2,

        calculationMethodName:
            "Muslim World League",

        madhab:
            "standard"

    };


    // =========================================
    // LOAD SETTINGS
    // =========================================

    async function loadSettings() {

        try {

            const response =
                await chrome.runtime.sendMessage({
                    action: "getSettings"
                });


            if (
                !response ||
                !response.success
            ) {

                throw new Error(
                    response?.error ||
                    "Unable to retrieve Sakinah settings."
                );

            }


            const settings =
                response.settings;


            updateProtection(
                settings.protectionEnabled
            );


            updateCategories(
                settings.categories
            );


            updateBlockedSites(
                settings.blockedSites
            );


            await loadPrayerSettings();


        } catch (error) {

            console.error(
                "Sakinah home page error:",
                error
            );

            showError();

        }

    }


    // =========================================
    // PROTECTION STATUS
    // =========================================

    function updateProtection(
        enabled
    ) {

        if (enabled === true) {

            protectionStatus.textContent =
                "Protection is active";

            protectionDescription.textContent =
                "Your selected content filters are currently active.";

            statusIndicator.classList.add(
                "active"
            );

        } else {

            protectionStatus.textContent =
                "Protection is disabled";

            protectionDescription.textContent =
                "Your content filters are currently inactive.";

            statusIndicator.classList.remove(
                "active"
            );

        }

    }


    // =========================================
    // CATEGORY STATUS
    // =========================================

    function updateCategories(
        categories = {}
    ) {

        filterStatuses.forEach(
            (statusElement) => {

                const category =
                    statusElement.dataset.category;


                const enabled =
                    categories[category] === true;


                if (enabled) {

                    statusElement.textContent =
                        "Active";

                    statusElement.classList.add(
                        "active"
                    );

                } else {

                    statusElement.textContent =
                        "Off";

                    statusElement.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    // =========================================
    // CUSTOM BLOCKED WEBSITES
    // =========================================

    function updateBlockedSites(
        sites = []
    ) {

        blockedSitesList.innerHTML = "";


        if (
            !Array.isArray(sites) ||
            sites.length === 0
        ) {

            const emptyState =
                document.createElement(
                    "p"
                );

            emptyState.className =
                "empty-state";

            emptyState.textContent =
                "No custom websites blocked.";

            blockedSitesList.appendChild(
                emptyState
            );

            return;

        }


        sites.forEach(
            (site) => {

                createBlockedSite(
                    site
                );

            }
        );

    }


    // =========================================
    // CREATE BLOCKED SITE ROW
    // =========================================

    function createBlockedSite(
        site
    ) {

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "home-site";


        const icon =
            document.createElement(
                "img"
            );

        icon.className =
            "home-site-icon";

        icon.alt = "";

        icon.src =
            `https://${site}/favicon.ico`;


        icon.onerror = () => {

            icon.onerror = null;

            icon.src =
                "icons/default-site.png";

        };


        const name =
            document.createElement(
                "span"
            );

        name.className =
            "home-site-name";

        name.textContent =
            site;


        row.appendChild(
            icon
        );

        row.appendChild(
            name
        );


        blockedSitesList.appendChild(
            row
        );

    }


    // =========================================
    // LOCATION PANEL
    // =========================================

    changeLocationButton.addEventListener(
        "click",
        () => {

            const isHidden =
                locationPanel.classList.contains(
                    "hidden"
                );


            locationPanel.classList.toggle(
                "hidden"
            );


            if (isHidden) {

                locationSearch.focus();

            }

        }
    );


    // =========================================
    // LOCATION SEARCH
    // =========================================

    searchLocationButton.addEventListener(
        "click",
        searchForLocation
    );


    locationSearch.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                searchForLocation();

            }

        }
    );


    async function searchForLocation() {

        const query =
            locationSearch.value.trim();


        if (!query) {

            locationSearchStatus.textContent =
                "Enter a city to search.";

            return;

        }


        searchLocationButton.disabled =
            true;


        locationSearchStatus.textContent =
            "Searching...";


        locationResults.innerHTML =
            "";


        try {

            /*
             * Nominatim requires user-triggered
             * requests and does not permit
             * client-side autocomplete.
             */

            const url =
                "https://nominatim.openstreetmap.org/search?" +
                new URLSearchParams({

                    q:
                        query,

                    format:
                        "jsonv2",

                    addressdetails:
                        "1",

                    limit:
                        "5"

                });


            const response =
                await fetch(
                    url
                );


            if (!response.ok) {

                throw new Error(
                    `Location search failed: ${response.status}`
                );

            }


            const results =
                await response.json();


            if (
                !Array.isArray(results) ||
                results.length === 0
            ) {

                locationSearchStatus.textContent =
                    "No locations found. Try another search.";

                return;

            }


            locationSearchStatus.textContent =
                "Select your location:";


            displayLocationResults(
                results
            );


        } catch (error) {

            console.error(
                "Location search error:",
                error
            );


            locationSearchStatus.textContent =
                "Unable to search for that location. Please try again.";

        } finally {

            searchLocationButton.disabled =
                false;

        }

    }


    // =========================================
    // DISPLAY LOCATION RESULTS
    // =========================================

    function displayLocationResults(
        results
    ) {

        locationResults.innerHTML =
            "";


        results.forEach(
            (result) => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "location-result";


                const address =
                    result.address || {};


                const city =
                    address.city ||
                    address.town ||
                    address.village ||
                    address.municipality ||
                    address.county ||
                    result.name ||
                    "Unknown location";


                const state =
                    address.state ||
                    "";


                const country =
                    address.country ||
                    "";


                const primaryText =
                    [
                        city,
                        state
                    ]
                    .filter(Boolean)
                    .join(", ");


                const secondaryText =
                    country ||
                    result.display_name ||
                    "";


                const strong =
                    document.createElement(
                        "strong"
                    );

                strong.textContent =
                    primaryText;


                const span =
                    document.createElement(
                        "span"
                    );

                span.textContent =
                    secondaryText;


                button.appendChild(
                    strong
                );

                button.appendChild(
                    span
                );


                button.addEventListener(
                    "click",
                    () => {

                        selectLocation(
                            result
                        );

                    }
                );


                locationResults.appendChild(
                    button
                );

            }
        );

    }


    // =========================================
    // SELECT LOCATION
    // =========================================

    async function selectLocation(
        result
    ) {

        const address =
            result.address || {};


        const city =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.county ||
            result.name ||
            "";


        const state =
            address.state ||
            "";


        const country =
            address.country ||
            "";


        const latitude =
            Number(
                result.lat
            );


        const longitude =
            Number(
                result.lon
            );


        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {

            locationSearchStatus.textContent =
                "This location did not provide valid coordinates.";

            return;

        }


        /*
         * Use the browser's current timezone.
         *
         * This works well when the selected city
         * is in the user's current timezone.
         */

        const timezone =
            Intl.DateTimeFormat().resolvedOptions().timeZone;


        const selectedLocation = {

            city:
                city,

            state:
                state,

            country:
                country,

            latitude:
                latitude,

            longitude:
                longitude,

            timezone:
                timezone

        };


        try {

            await chrome.storage.local.set({

                prayerLocation:
                    selectedLocation

            });


            prayerLocation.textContent =
                [
                    city,
                    state
                ]
                .filter(Boolean)
                .join(", ");


            locationPanel.classList.add(
                "hidden"
            );


            locationResults.innerHTML =
                "";

            locationSearch.value =
                "";

            locationSearchStatus.textContent =
                "";


            await loadPrayerTimes(
                selectedLocation
            );


        } catch (error) {

            console.error(
                "Unable to save location:",
                error
            );

            locationSearchStatus.textContent =
                "Unable to save this location.";

        }

    }


    // =========================================
    // LOAD SAVED PRAYER SETTINGS
    // =========================================

    async function loadPrayerSettings() {

        const stored =
            await chrome.storage.local.get([
                "prayerLocation",
                "prayerSettings"
            ]);


        const settings =
            stored.prayerSettings ||
            DEFAULT_PRAYER_SETTINGS;


        calculationMethod.textContent =
            settings.calculationMethodName ||
            DEFAULT_PRAYER_SETTINGS.calculationMethodName;


        madhab.textContent =
            settings.madhab === "hanafi"
                ? "Hanafi"
                : "Standard";


        if (
            stored.prayerLocation
        ) {

            const location =
                stored.prayerLocation;


            prayerLocation.textContent =
                [
                    location.city,
                    location.state
                ]
                .filter(Boolean)
                .join(", ");


            await loadPrayerTimes(
                location,
                settings
            );

        } else {

            prayerLocation.textContent =
                "Location not set";


            resetPrayerTimes();

        }

    }


    // =========================================
    // LOAD PRAYER TIMES
    // =========================================

    async function loadPrayerTimes(
        location,
        settings = DEFAULT_PRAYER_SETTINGS
    ) {

        if (
            !location ||
            !Number.isFinite(
                Number(location.latitude)
            ) ||
            !Number.isFinite(
                Number(location.longitude)
            )
        ) {

            resetPrayerTimes();

            return;

        }


        try {

            setPrayerLoadingState();


            const now =
                new Date();


            const day =
                String(
                    now.getDate()
                )
                .padStart(
                    2,
                    "0"
                );


            const month =
                String(
                    now.getMonth() + 1
                )
                .padStart(
                    2,
                    "0"
                );


            const year =
                now.getFullYear();


            const method =
                settings.calculationMethod ||
                DEFAULT_PRAYER_SETTINGS.calculationMethod;


            const school =
                settings.madhab === "hanafi"
                    ? 1
                    : 0;


            const url =
                "https://api.aladhan.com/v1/timings/" +
                `${day}-${month}-${year}?` +
                new URLSearchParams({

                    latitude:
                        location.latitude,

                    longitude:
                        location.longitude,

                    method:
                        method,

                    school:
                        school

                });


            const response =
                await fetch(
                    url
                );


            if (!response.ok) {

                throw new Error(
                    `Prayer API returned ${response.status}`
                );

            }


            const result =
                await response.json();


            if (
                result.code !== 200 ||
                !result.data ||
                !result.data.timings
            ) {

                throw new Error(
                    "Invalid prayer time response."
                );

            }


            displayPrayerTimes(
                result.data.timings
            );


            updateNextPrayer(
                result.data.timings
            );


        } catch (error) {

            console.error(
                "Prayer time error:",
                error
            );


            resetPrayerTimes();


            nextPrayer.textContent =
                "Unable to load";


            nextPrayerTime.textContent =
                "--";


            nextPrayerCountdown.textContent =
                "Please try again later.";

        }

    }


    // =========================================
    // DISPLAY PRAYER TIMES
    // =========================================

    function displayPrayerTimes(
        timings
    ) {

        fajrTime.textContent =
            formatPrayerTime(
                timings.Fajr
            );


        dhuhrTime.textContent =
            formatPrayerTime(
                timings.Dhuhr
            );


        asrTime.textContent =
            formatPrayerTime(
                timings.Asr
            );


        maghribTime.textContent =
            formatPrayerTime(
                timings.Maghrib
            );


        ishaTime.textContent =
            formatPrayerTime(
                timings.Isha
            );

    }


    // =========================================
    // FORMAT TIME
    // =========================================

    function formatPrayerTime(
        time
    ) {

        if (
            !time ||
            typeof time !== "string"
        ) {

            return "--";

        }


        const cleanTime =
            time.split(" ")[0];


        const parts =
            cleanTime.split(":");


        if (
            parts.length < 2
        ) {

            return time;

        }


        let hours =
            Number(
                parts[0]
            );


        const minutes =
            parts[1];


        if (
            !Number.isFinite(hours)
        ) {

            return time;

        }


        const suffix =
            hours >= 12
                ? "PM"
                : "AM";


        hours =
            hours % 12 || 12;


        return `${hours}:${minutes} ${suffix}`;

    }


    // =========================================
    // NEXT PRAYER
    // =========================================

    function updateNextPrayer(
        timings
    ) {

        const prayers = [

            {
                name: "Fajr",
                time: timings.Fajr
            },

            {
                name: "Dhuhr",
                time: timings.Dhuhr
            },

            {
                name: "Asr",
                time: timings.Asr
            },

            {
                name: "Maghrib",
                time: timings.Maghrib
            },

            {
                name: "Isha",
                time: timings.Isha
            }

        ];


        const now =
            new Date();


        const currentMinutes =
            now.getHours() * 60 +
            now.getMinutes();


        let upcomingPrayer =
            null;


        for (
            const prayer of prayers
        ) {

            if (
                !prayer.time
            ) {

                continue;

            }


            const parts =
                prayer.time
                    .split(":");


            const hour =
                Number(
                    parts[0]
                );


            const minute =
                Number(
                    parts[1]
                );


            const prayerMinutes =
                hour * 60 +
                minute;


            if (
                prayerMinutes >
                currentMinutes
            ) {

                upcomingPrayer = {

                    ...prayer,

                    prayerMinutes:
                        prayerMinutes

                };

                break;

            }

        }


        /*
         * If all prayers have passed,
         * the next prayer is tomorrow's Fajr.
         */

        if (!upcomingPrayer) {

            const fajr =
                prayers[0];


            const parts =
                fajr.time.split(":");


            const hour =
                Number(
                    parts[0]
                );


            const minute =
                Number(
                    parts[1]
                );


            upcomingPrayer = {

                ...fajr,

                prayerMinutes:
                    hour * 60 +
                    minute,

                tomorrow:
                    true

            };

        }


        nextPrayer.textContent =
            upcomingPrayer.name;


        nextPrayerTime.textContent =
            formatPrayerTime(
                upcomingPrayer.time
            );


        updateCountdown(
            upcomingPrayer
        );

    }


    // =========================================
    // NEXT PRAYER COUNTDOWN
    // =========================================

    function updateCountdown(
        prayer
    ) {

        const update = () => {

            const now =
                new Date();


            let target =
                new Date(
                    now
                );


            const parts =
                prayer.time.split(":");


            target.setHours(
                Number(parts[0]),
                Number(parts[1]),
                0,
                0
            );


            if (
                target <= now
            ) {

                target.setDate(
                    target.getDate() + 1
                );

            }


            const difference =
                target.getTime() -
                now.getTime();


            const totalMinutes =
                Math.max(
                    0,
                    Math.floor(
                        difference /
                        60000
                    )
                );


            const hours =
                Math.floor(
                    totalMinutes / 60
                );


            const minutes =
                totalMinutes % 60;


            if (hours > 0) {

                nextPrayerCountdown.textContent =
                    `in ${hours}h ${minutes}m`;

            } else {

                nextPrayerCountdown.textContent =
                    `in ${minutes}m`;

            }

        };


        update();


        setInterval(
            update,
            60000
        );

    }


    // =========================================
    // RESET PRAYER TIMES
    // =========================================

    function resetPrayerTimes() {

        fajrTime.textContent =
            "--";

        dhuhrTime.textContent =
            "--";

        asrTime.textContent =
            "--";

        maghribTime.textContent =
            "--";

        ishaTime.textContent =
            "--";

        nextPrayer.textContent =
            "Set your location";

        nextPrayerTime.textContent =
            "--";

        nextPrayerCountdown.textContent =
            "--";

    }


    // =========================================
    // LOADING STATE
    // =========================================

    function setPrayerLoadingState() {

        fajrTime.textContent =
            "...";

        dhuhrTime.textContent =
            "...";

        asrTime.textContent =
            "...";

        maghribTime.textContent =
            "...";

        ishaTime.textContent =
            "...";

        nextPrayer.textContent =
            "Loading...";

        nextPrayerTime.textContent =
            "...";

        nextPrayerCountdown.textContent =
            "...";

    }


    // =========================================
    // ERROR STATE
    // =========================================

    function showError() {

        protectionStatus.textContent =
            "Unable to load settings";


        protectionDescription.textContent =
            "Sakinah could not retrieve your current settings.";


        statusIndicator.classList.remove(
            "active"
        );


        filterStatuses.forEach(
            (statusElement) => {

                statusElement.textContent =
                    "Unavailable";

                statusElement.classList.remove(
                    "active"
                );

            }
        );


        blockedSitesList.innerHTML =
            '<p class="empty-state">Unable to load blocked websites.</p>';

    }


    // =========================================
    // INITIALIZE
    // =========================================

    await loadSettings();

});
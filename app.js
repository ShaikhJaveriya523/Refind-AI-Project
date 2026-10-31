
document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // 1. BASIC SETTINGS
    // ==========================================

    const API_URL = "http://localhost:5000/api";

    const currentUser = localStorage.getItem("loggedInUser");

    const ALERT_KEY = "refindAlerts";

    let reports = [];
    let alerts = [];

    function loadData() {
        try {
            alerts = JSON.parse(
                localStorage.getItem(ALERT_KEY) || "[]"
            );

            if (!Array.isArray(alerts)) alerts = [];

        } catch (error) {
            alerts = [];
        }
    }

    function saveData() {
        // Reports are saved in SQLite.
        // Only temporary alerts are stored locally for now.
        localStorage.setItem(ALERT_KEY, JSON.stringify(alerts));
    }

    loadData();


    // ==========================================
    // 2. SAFE HTML DISPLAY
    // ==========================================

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }


    // ==========================================
    // 3. FETCH SHARED REPORTS FROM DATABASE
    // ==========================================

    async function fetchReportsFromServer() {

        try {

            const response = await fetch(`${API_URL}/reports`);

            if (!response.ok) {
                throw new Error("Unable to fetch reports.");
            }

            const data = await response.json();

            if (!data.success || !Array.isArray(data.reports)) {
                throw new Error("Invalid reports response.");
            }

            reports = data.reports.map(function (report) {

                return {
                    ...report,

                    id: String(report.id),

                    lostDate:
                        report.type === "lost" ? report.eventDate : "",

                    foundDate:
                        report.type === "found" ? report.eventDate : "",

                    brand: report.brand || "",
                    category: report.category || "",
                    color: report.color || "",
                    itemName: report.itemName || "",
                    fromCity: report.fromCity || "",
                    toCity: report.toCity || "",
                    location: report.location || "",
                    busNumber: report.busNumber || "",
                    description: report.description || "",
                    photo: report.photo || "",
                    email: report.email || "",
                    status: report.status || "active"

                };

            });

            console.log("Shared reports loaded:", reports.length);

            updateDashboard();
            displayMyReports();
            displayMatches();

        } catch (error) {

            console.error("Reports loading error:", error);

            console.error(
                "Check whether Node.js backend is running on port 5000."
            );

        }
    }


    // ==========================================
    // 4. NAVIGATION
    // ==========================================

    const navButtons = document.querySelectorAll("[data-view]");

    function showView(viewName) {

        document.querySelectorAll(".app-view").forEach(function (view) {
            view.classList.remove("active");
        });

        const selectedView = document.getElementById(viewName + "View");

        if (!selectedView) return;

        selectedView.classList.add("active");

        navButtons.forEach(function (button) {

            button.classList.toggle(
                "active",
                button.dataset.view === viewName
            );

        });

        if (viewName === "dashboard") updateDashboard();
        if (viewName === "reports") displayMyReports();
        if (viewName === "matches") displayMatches();
        if (viewName === "alerts") displayAlerts();

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    navButtons.forEach(function (button) {

        button.addEventListener("click", function () {
            showView(button.dataset.view);
        });

    });


    // ==========================================
    // 5. LOGOUT
    // ==========================================

    document.getElementById("logoutBtn").addEventListener(
        "click",
        function () {

            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("loggedInUser");

            window.location.href = "login.html";

        }
    );


    // ==========================================
    // 6. PHOTO UPLOAD AND CAMERA
    // ==========================================

    function compressImage(file) {

        return new Promise(function (resolve, reject) {

            if (!file || !file.type.startsWith("image/")) {
                reject(new Error("Please select a valid image."));
                return;
            }

            if (file.size > 8 * 1024 * 1024) {
                reject(new Error("Please select an image smaller than 8 MB."));
                return;
            }

            const reader = new FileReader();

            reader.onload = function (event) {

                const image = new Image();

                image.onload = function () {

                    const maxWidth = 900;
                    const maxHeight = 900;

                    let width = image.width;
                    let height = image.height;

                    const ratio = Math.min(
                        1,
                        maxWidth / width,
                        maxHeight / height
                    );

                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);

                    const canvas = document.createElement("canvas");

                    canvas.width = width;
                    canvas.height = height;

                    const context = canvas.getContext("2d");

                    context.drawImage(image, 0, 0, width, height);

                    resolve(canvas.toDataURL("image/jpeg", 0.72));

                };

                image.onerror = function () {
                    reject(new Error("Unable to read this image."));
                };

                image.src = event.target.result;

            };

            reader.onerror = function () {
                reject(new Error("Unable to upload image."));
            };

            reader.readAsDataURL(file);

        });
    }


    
    // ==========================================
    // 7. REPORT FORMS - UPDATED CAMERA & GPS
    // ==========================================

    document.querySelectorAll(".report-form").forEach(function (form) {

        const photoInput = form.querySelector('[name="photo"]');
        const preview = form.querySelector(".photo-preview");

        const cameraButton = form.querySelector(".camera-btn");

        const gpsButton = form.querySelector(".gps-button");
        const gpsStatus = form.querySelector(".gps-status");

        const locationInput = form.querySelector('[name="location"]');

        let selectedImage = null;
        let gpsData = null;


        // ==========================================
        // PHOTO UPLOAD
        // ==========================================

        photoInput.addEventListener("change", function () {

            processSelectedPhoto(photoInput.files[0]);

        });


        // ==========================================
        // PROCESS AND COMPRESS PHOTO
        // ==========================================

        async function processSelectedPhoto(file) {

            if (!file) return;

            try {

                selectedImage = await compressImage(file);

                preview.innerHTML = `
                    <img src="${selectedImage}" alt="Item Preview">
                    <p>Photo selected successfully!</p>
                `;

            } catch (error) {

                selectedImage = null;

                preview.textContent = error.message;

            }
        }


        // ==========================================
        // 8. LIVE CAMERA FUNCTIONALITY
        // ==========================================

        cameraButton.addEventListener("click", async function (event) {

            event.preventDefault();

            if (!navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia) {

                alert("Camera is not supported. Please open using Live Server.");

                return;
            }

            let stream = null;
            let modal = null;

            try {

                stream = await navigator.mediaDevices.getUserMedia({

                    video: {
                        facingMode: "user"
                    },

                    audio: false

                });


                // Create camera popup

                modal = document.createElement("div");

                modal.style.cssText = `
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.85);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    padding: 20px;
                `;


                modal.innerHTML = `

                    <div style="
                        background: white;
                        padding: 20px;
                        border-radius: 15px;
                        width: 100%;
                        max-width: 500px;
                        text-align: center;
                    ">

                        <h2>Capture Item Photo</h2>

                        <video
                            id="refindCameraVideo"
                            autoplay
                            playsinline
                            style="
                                width: 100%;
                                border-radius: 10px;
                                background: black;
                            ">
                        </video>

                        <br><br>

                        <button
                            type="button"
                            id="captureRefindPhoto">
                            📸 Capture Photo
                        </button>

                        <button
                            type="button"
                            id="closeRefindCamera">
                            ✖ Close Camera
                        </button>

                    </div>

                `;


                document.body.appendChild(modal);


                const video = modal.querySelector(
                    "#refindCameraVideo"
                );

                video.srcObject = stream;

                await video.play();


                // Stop camera

                function closeCamera() {

                    if (stream) {

                        stream.getTracks().forEach(function (track) {

                            track.stop();

                        });

                    }

                    if (modal && modal.parentNode) {

                        modal.remove();

                    }

                }


                // Close button

                modal.querySelector("#closeRefindCamera")
                    .addEventListener("click", closeCamera);


                // Capture button

                modal.querySelector("#captureRefindPhoto")
                    .addEventListener("click", function () {

                        if (!video.videoWidth || !video.videoHeight) {

                            alert("Camera is not ready. Try again.");

                            return;

                        }


                        const canvas = document.createElement("canvas");

                        canvas.width = video.videoWidth;

                        canvas.height = video.videoHeight;


                        const context = canvas.getContext("2d");

                        context.drawImage(
                            video,
                            0,
                            0,
                            canvas.width,
                            canvas.height
                        );


                        canvas.toBlob(async function (blob) {

                            if (!blob) {

                                alert("Unable to capture photo.");

                                return;

                            }


                            const capturedFile = new File(

                                [blob],

                                "refind-camera-photo.jpg",

                                { type: "image/jpeg" }

                            );


                            photoInput.value = "";

                            await processSelectedPhoto(capturedFile);

                            closeCamera();


                        }, "image/jpeg", 0.85);

                    });


            } catch (error) {

                console.error("Camera Error:", error);


                let errorMessage = "Unable to open camera.";

                if (error.name === "NotAllowedError") {

                    errorMessage =
                        "Camera permission denied. Please allow camera access.";

                } else if (error.name === "NotFoundError") {

                    errorMessage =
                        "No camera found on your device.";

                } else if (error.name === "NotReadableError") {

                    errorMessage =
                        "Camera is already being used by another application.";

                }


                alert(errorMessage);


                if (stream) {

                    stream.getTracks().forEach(function (track) {

                        track.stop();

                    });

                }

                if (modal) modal.remove();

            }

        });


        // ==========================================
        // 9. GPS LOCATION DETECTION
        // ==========================================

        gpsButton.addEventListener("click", function () {

            if (!navigator.geolocation) {

                gpsStatus.textContent =
                    "GPS is not supported by this browser.";

                return;

            }


            gpsButton.disabled = true;

            gpsStatus.textContent =
                "Detecting your current location...";

            gpsStatus.style.color = "#2563eb";


            navigator.geolocation.getCurrentPosition(

                function (position) {

                    gpsData = {

                        latitude: position.coords.latitude,

                        longitude: position.coords.longitude

                    };


                    // Automatically fill location input

                    locationInput.value =

                        "Latitude: " +
                        gpsData.latitude.toFixed(6) +

                        ", Longitude: " +
                        gpsData.longitude.toFixed(6);


                    gpsStatus.textContent =

                        "✓ Location detected successfully!";


                    gpsStatus.style.color = "green";

                    gpsButton.disabled = false;


                    console.log("GPS Location:", gpsData);

                },


                function (error) {

                    gpsData = null;

                    let errorMessage = "Unable to detect location.";

                    if (error.code === 1) {

                        errorMessage =
                            "Location permission denied. Please allow location access.";

                    } else if (error.code === 2) {

                        errorMessage =
                            "Location unavailable. Check your device location settings.";

                    } else if (error.code === 3) {

                        errorMessage =
                            "Location request timed out. Please try again.";

                    }


                    gpsStatus.textContent = errorMessage;

                    gpsStatus.style.color = "red";

                    gpsButton.disabled = false;

                },


                {

                    enableHighAccuracy: true,

                    timeout: 20000,

                    maximumAge: 0

                }

            );

        });


        // ==========================================
        // 10. SUBMIT LOST / FOUND REPORT
        // ==========================================

        form.addEventListener("submit", async function (event) {

            event.preventDefault();


            const message = form.querySelector(".form-message");

            const submitButton =
                form.querySelector(".submit-report-btn");

            const type = form.dataset.type;


            message.style.color = "#dc2626";


            if (!selectedImage) {

                message.textContent =
                    "Please upload or capture an item photo.";

                return;

            }


            if (!locationInput.value.trim()) {

                message.textContent =
                    "Please enter the item location.";

                locationInput.focus();

                return;

            }


            const formData = new FormData(form);


            const report = {

                type: type,

                itemName: formData.get("itemName").trim(),

                brand: formData.get("brand").trim(),

                category: formData.get("category"),

                color: formData.get("color"),

                fromCity: formData.get("fromCity").trim(),

                toCity: formData.get("toCity").trim(),

                eventDate: formData.get("eventDate"),

                eventTime: formData.get("eventTime"),

                location: formData.get("location").trim(),

                busNumber: formData.get("busNumber").trim(),

                description: formData.get("description").trim(),

                photo: selectedImage,

                latitude: gpsData ? gpsData.latitude : null,

                longitude: gpsData ? gpsData.longitude : null,

                email: currentUser,

                currentUser: currentUser,

                status: "active"

            };


            submitButton.disabled = true;

            submitButton.textContent = "Submitting...";


            try {

                const response = await fetch(`${API_URL}/reports`, {

                    method: "POST",

                    headers: {

                        "Content-Type": "application/json"

                    },

                    body: JSON.stringify(report)

                });


                const data = await response.json();


                if (!response.ok || !data.success) {

                    throw new Error(

                        data.message || "Unable to save report."

                    );

                }


                await fetchReportsFromServer();

                updateMatchesAndAlerts();


                // Reset form

                form.reset();

                selectedImage = null;

                gpsData = null;

                preview.innerHTML = "";


                gpsStatus.textContent =
                    "Location not detected yet.";

                gpsStatus.style.color = "";


                message.style.color = "#16803c";

                message.textContent =

                    type === "lost"

                        ? "Lost report submitted successfully!"

                        : "Found report submitted successfully!";


                alert(

                    type === "lost"

                        ? "Your lost report has been submitted!"

                        : "Your found report has been submitted!"

                );


                updateDashboard();


                setTimeout(function () {

                    showView("reports");

                }, 500);


            } catch (error) {

                console.error("Report submission error:", error);

                message.textContent =

                    error.message ||

                    "Unable to save report. Please try again.";

            } finally {

                submitButton.disabled = false;

                submitButton.textContent =

                    type === "lost"

                        ? "Submit Lost Report"

                        : "Submit Found Report";

            }

        });

    });


    // ==========================================
    // 10. DASHBOARD STATISTICS
    // ==========================================

    function updateDashboard() {

        const ownReports = reports.filter(function (report) {

            return report.email === currentUser;

        });


        document.getElementById("lostCount").textContent =
            ownReports.filter(function (r) {
                return r.type === "lost" && r.status === "active";
            }).length;


        document.getElementById("foundCount").textContent =
            ownReports.filter(function (r) {
                return r.type === "found" && r.status === "active";
            }).length;


        document.getElementById("matchCount").textContent =
            getMatches().filter(function (match) {

                return match.lost.email === currentUser ||
                    match.found.email === currentUser;

            }).length;


        document.getElementById("recoveredCount").textContent =
            ownReports.filter(function (r) {
                return r.status === "recovered";
            }).length;


        updateAlertBadge();

    }


    // ==========================================
    // 11. MY REPORTS
    // ==========================================

    const myReportsContainer =
        document.getElementById("myReportsContainer");

    const reportFilter =
        document.getElementById("reportFilter");


    function displayMyReports() {

        const filter = reportFilter.value;

        let myReports = reports.filter(function (report) {

            return report.email === currentUser;

        });


        if (filter === "lost" || filter === "found") {

            myReports = myReports.filter(function (r) {
                return r.type === filter;
            });

        } else if (filter === "recovered") {

            myReports = myReports.filter(function (r) {
                return r.status === "recovered";
            });

        }


        if (myReports.length === 0) {

            myReportsContainer.innerHTML = `
                <div class="empty-state">
                    <h2>No reports found</h2>
                    <p>Your submitted reports will appear here.</p>
                </div>
            `;

            return;

        }


        myReportsContainer.innerHTML = myReports
            .slice()
            .reverse()
            .map(function (report) {

                return `
                    <div class="report-card">

                        ${report.photo ? `
                            <img src="${escapeHTML(report.photo)}"
                                 alt="Item photo">
                        ` : ""}

                        <h3>${escapeHTML(report.itemName)}</h3>

                        <p><b>Type:</b> ${escapeHTML(report.type)}</p>

                        <p><b>Brand:</b> ${escapeHTML(report.brand)}</p>

                        <p><b>Category:</b> ${escapeHTML(report.category)}</p>

                        <p><b>Color:</b> ${escapeHTML(report.color)}</p>

                        <p><b>Journey:</b>
                            ${escapeHTML(report.fromCity)}
                            to
                            ${escapeHTML(report.toCity)}
                        </p>

                        <p><b>Location:</b>
                            ${escapeHTML(report.location)}
                        </p>

                        <p><b>Date:</b>
                            ${escapeHTML(report.lostDate || report.foundDate)}
                        </p>

                        <p><b>Status:</b>
                            ${escapeHTML(report.status)}
                        </p>

                        <p><b>Description:</b>
                            ${escapeHTML(report.description)}
                        </p>

                    </div>
                `;

            }).join("");

    }


    reportFilter.addEventListener("change", displayMyReports);


    // ==========================================
    // 12. RULE-BASED MATCHING SYSTEM
    // ==========================================

    function getMatchScore(lost, found) {

        if (lost.type !== "lost" || found.type !== "found") {
            return 0;
        }

        let score = 0;

        const lostCategory = (lost.category || "").toLowerCase();
        const foundCategory = (found.category || "").toLowerCase();

        const lostColor = (lost.color || "").toLowerCase();
        const foundColor = (found.color || "").toLowerCase();

        const lostBrand = (lost.brand || "").toLowerCase();
        const foundBrand = (found.brand || "").toLowerCase();

        const lostName = (lost.itemName || "").toLowerCase();
        const foundName = (found.itemName || "").toLowerCase();

        const lostFrom = (lost.fromCity || "").toLowerCase();
        const foundFrom = (found.fromCity || "").toLowerCase();

        const lostTo = (lost.toCity || "").toLowerCase();
        const foundTo = (found.toCity || "").toLowerCase();


        // Category comparison

        if (lostCategory && lostCategory === foundCategory) {
            score += 25;
        }


        // Color comparison

        if (lostColor && lostColor === foundColor) {
            score += 15;
        }


        // Brand comparison

        if (lostBrand && lostBrand === foundBrand) {
            score += 15;
        }


        // Item name comparison

        const lostWords = lostName.split(/\s+/);

        const foundWords = foundName.split(/\s+/);

        const commonWords = lostWords.filter(function (word) {

            return word.length > 1 && foundWords.includes(word);

        });

        if (commonWords.length > 0) {

            score += 20 * commonWords.length /
                Math.max(lostWords.length, foundWords.length);

        }


        // Journey comparison

        const sameFrom = lostFrom && lostFrom === foundFrom;

        const sameTo = lostTo && lostTo === foundTo;

        if (sameFrom && sameTo) {
            score += 15;
        } else if (sameFrom || sameTo) {
            score += 8;
        }


        // Bus number comparison

        if (
            lost.busNumber &&
            found.busNumber &&
            lost.busNumber.toLowerCase() ===
            found.busNumber.toLowerCase()
        ) {
            score += 5;
        }


        // Location comparison

        if (
            lost.location &&
            found.location &&
            lost.location.toLowerCase() ===
            found.location.toLowerCase()
        ) {
            score += 5;
        }


        return Math.min(100, Math.round(score));

    }


    function getMatches() {

        const results = [];

        const lostReports = reports.filter(function (r) {

            return r.type === "lost" && r.status === "active";

        });

        const foundReports = reports.filter(function (r) {

            return r.type === "found" && r.status === "active";

        });


        lostReports.forEach(function (lost) {

            foundReports.forEach(function (found) {

                // Do not match a user's report with their own report

                if (
                    lost.email &&
                    found.email &&
                    lost.email === found.email
                ) {
                    return;
                }


                const score = getMatchScore(lost, found);

                if (score >= 45) {

                    results.push({
                        lost: lost,
                        found: found,
                        score: score
                    });

                }

            });

        });


        return results.sort(function (a, b) {
            return b.score - a.score;
        });

    }


    // ==========================================
    // 13. CREATE LOCAL MATCH ALERTS
    // ==========================================

    function updateMatchesAndAlerts() {

        const matches = getMatches();

        matches.forEach(function (match) {

            const involvedUsers = [
                match.lost.email,
                match.found.email
            ];


            involvedUsers.forEach(function (email) {

                if (!email) return;


                const alreadyExists = alerts.some(function (alert) {

                    return alert.lostId === match.lost.id &&
                        alert.foundId === match.found.id &&
                        alert.email === email;

                });


                if (!alreadyExists) {

                    alerts.push({

                        id: "ALERT-" + Date.now() + "-" +
                            Math.random().toString(36).slice(2, 7),

                        lostId: match.lost.id,

                        foundId: match.found.id,

                        email: email,

                        score: match.score,

                        message:
                            "A potential match was found for " +
                            match.lost.itemName,

                        read: false,

                        createdAt: new Date().toISOString()

                    });

                }

            });

        });


        saveData();

        updateAlertBadge();

    }


    // ==========================================
    // 14. DISPLAY MATCHES
    // ==========================================

    function displayMatches() {

        const container =
            document.getElementById("matchesContainer");


        const matches = getMatches().filter(function (match) {

            return match.lost.email === currentUser ||
                match.found.email === currentUser;

        });


        if (matches.length === 0) {

            container.innerHTML = `
                <div class="empty-state">
                    <h2>No potential matches yet</h2>
                    <p>Matching lost and found reports will appear here.</p>
                </div>
            `;

            return;

        }


        container.innerHTML = matches.map(function (match) {

            return `
                <div class="report-card">

                    <span class="match-label">
                        Potential Match
                    </span>

                    <div class="match-score">
                        ${match.score}% Rule-Based Match
                    </div>


                    <h3>Lost: ${escapeHTML(match.lost.itemName)}</h3>

                    ${match.lost.photo ? `
                        <img src="${escapeHTML(match.lost.photo)}"
                             alt="Lost item">
                    ` : ""}

                    <p><b>Category:</b>
                        ${escapeHTML(match.lost.category)}
                    </p>

                    <p><b>Color:</b>
                        ${escapeHTML(match.lost.color)}
                    </p>

                    <p><b>Brand:</b>
                        ${escapeHTML(match.lost.brand)}
                    </p>


                    <hr>


                    <h3>Found: ${escapeHTML(match.found.itemName)}</h3>

                    ${match.found.photo ? `
                        <img src="${escapeHTML(match.found.photo)}"
                             alt="Found item">
                    ` : ""}

                    <p><b>Category:</b>
                        ${escapeHTML(match.found.category)}
                    </p>

                    <p><b>Color:</b>
                        ${escapeHTML(match.found.color)}
                    </p>

                    <p><b>Brand:</b>
                        ${escapeHTML(match.found.brand)}
                    </p>

                    <p><b>Found Location:</b>
                        ${escapeHTML(match.found.location)}
                    </p>

                    <p><b>Contact:</b>
                        ${escapeHTML(
                            match.lost.email === currentUser
                                ? match.found.email
                                : match.lost.email
                        )}
                    </p>

                </div>
            `;

        }).join("");

    }


    document.getElementById("refreshMatches").addEventListener(
        "click",
        async function () {

            await fetchReportsFromServer();

            updateMatchesAndAlerts();

            displayMatches();

        }
    );


    // ==========================================
    // 15. ALERT NOTIFICATIONS
    // ==========================================

    function displayAlerts() {

        const container =
            document.getElementById("alertsContainer");


        const myAlerts = alerts.filter(function (alert) {

            return alert.email === currentUser;

        });


        if (myAlerts.length === 0) {

            container.innerHTML = `
                <div class="empty-state">
                    <h2>No notifications</h2>
                    <p>New potential match alerts will appear here.</p>
                </div>
            `;

            return;

        }


        container.innerHTML = myAlerts
            .slice()
            .reverse()
            .map(function (alert) {

                return `
                    <div class="alert-card ${alert.read ? "" : "unread"}">

                        <h3>Potential Match Found!</h3>

                        <p>${escapeHTML(alert.message)}</p>

                        <p><b>Match Score:</b>
                            ${escapeHTML(alert.score)}%
                        </p>

                        <p>
                            ${new Date(alert.createdAt).toLocaleString()}
                        </p>

                        ${!alert.read ? `
                            <button class="gps-button"
                                data-alert-id="${escapeHTML(alert.id)}">
                                Mark as Read
                            </button>
                        ` : "<p>Read</p>"}

                    </div>
                `;

            }).join("");

    }


    document.getElementById("alertsContainer").addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest("[data-alert-id]");

            if (!button) return;


            const selectedAlert = alerts.find(function (a) {

                return a.id === button.dataset.alertId &&
                    a.email === currentUser;

            });


            if (selectedAlert) {

                selectedAlert.read = true;

                saveData();

                displayAlerts();

                updateAlertBadge();

            }

        }
    );


    // Mark all alerts as read

    document.getElementById("readAllAlerts").addEventListener(
        "click",
        function () {

            alerts.forEach(function (alert) {

                if (alert.email === currentUser) {
                    alert.read = true;
                }

            });


            saveData();

            displayAlerts();

            updateAlertBadge();

        }
    );


    // ==========================================
    // 16. ALERT BADGE
    // ==========================================

    function updateAlertBadge() {

        const unreadCount = alerts.filter(function (alert) {

            return alert.email === currentUser && !alert.read;

        }).length;


        document.getElementById("alertBadge").textContent =
            unreadCount;

    }


    // ==========================================
    // 17. INITIALIZE APPLICATION
    // ==========================================

    updateDashboard();

    displayMyReports();

    updateAlertBadge();

    showView("dashboard");

    // Load reports from shared database
    fetchReportsFromServer().then(function () {

        updateMatchesAndAlerts();

        updateDashboard();

        displayMatches();

    });


    console.log(
        "ReFind AI application initialized successfully!"
    );

});

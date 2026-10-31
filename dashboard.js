
document.addEventListener("DOMContentLoaded", function () {

    // =================================
    // 1. NAVIGATION ACTIVE STATE
    // =================================

    const navItems = document.querySelectorAll(".nav-item");

    const currentPage = window.location.pathname
        .split("/")
        .pop() || "dashboard.html";

    navItems.forEach(function (item) {

        item.classList.remove("active");

        if (item.dataset.page === currentPage) {
            item.classList.add("active");
        }

    });


    // =================================
    // 2. GET REPORTS FROM LOCAL STORAGE
    // =================================

    let reports = [];

    try {

        const savedReports = localStorage.getItem("refindReports");

        reports = savedReports ? JSON.parse(savedReports) : [];

        if (!Array.isArray(reports)) {
            reports = [];
        }

    } catch (error) {

        console.error("Unable to load reports:", error);

        reports = [];

    }


    // =================================
    // 3. COUNT LOST ITEMS
    // =================================

    const lostItems = reports.filter(function (report) {

        return report.type &&
            report.type.toLowerCase() === "lost";

    });

    document.getElementById("lostCount").textContent =
        lostItems.length;


    // =================================
    // 4. COUNT FOUND ITEMS
    // =================================

    const foundItems = reports.filter(function (report) {

        return report.type &&
            report.type.toLowerCase() === "found";

    });

    document.getElementById("foundCount").textContent =
        foundItems.length;


    // =================================
    // 5. COUNT POTENTIAL MATCHES
    // =================================

    let matches = [];

    try {

        const savedMatches = localStorage.getItem("refindMatches");

        matches = savedMatches ? JSON.parse(savedMatches) : [];

        if (!Array.isArray(matches)) {
            matches = [];
        }

    } catch (error) {

        console.error("Unable to load matches:", error);

        matches = [];

    }

    document.getElementById("matchCount").textContent =
        matches.length;


    // =================================
    // 6. COUNT RECOVERED ITEMS
    // =================================

    const recoveredItems = reports.filter(function (report) {

        return report.status &&
            report.status.toLowerCase() === "recovered";

    });

    document.getElementById("recoveredCount").textContent =
        recoveredItems.length;


    // =================================
    // 7. DASHBOARD NAVIGATION
    // =================================

    navItems.forEach(function (item) {

        item.addEventListener("click", function () {

            const destination = item.getAttribute("href");

            if (destination) {
                window.location.href = destination;
            }

        });

    });


    // =================================
    // 8. LOST ITEM CARD
    // =================================

    const lostCard = document.querySelector(".lost-card");

    lostCard.addEventListener("click", function () {

        window.location.href = "report-lost.html";

    });


    // =================================
    // 9. FOUND ITEM CARD
    // =================================

    const foundCard = document.querySelector(".found-card");

    foundCard.addEventListener("click", function () {

        window.location.href = "report-found.html";

    });


    console.log("ReFind AI Dashboard loaded successfully!");

});

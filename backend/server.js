
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");

// Connect SQLite database
const db = require("./database");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: "15mb" }));

const upload = multer({
    storage: multer.memoryStorage()
});

// Home route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "ReFind AI Backend is running!"
    });
});

// GET ALL REPORTS - All users can see reports
app.get("/api/reports", (req, res) => {
    try {
        const reports = db.prepare(`
            SELECT * FROM reports
            ORDER BY id DESC
        `).all();

        res.json({
            success: true,
            reports: reports
        });

    } catch (error) {
        console.error("Fetch reports error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch reports."
        });
    }
});

// CREATE NEW REPORT
app.post("/api/reports", (req, res) => {
    try {
        const {
            type,
            itemName,
            brand,
            category,
            color,
            fromCity,
            toCity,
            eventDate,
            eventTime,
            location,
            busNumber,
            description,
            photo,
            latitude,
            longitude,
            email,
            currentUser,
            status
        } = req.body;

        if (!["lost", "found"].includes(type) || !itemName) {
            return res.status(400).json({
                success: false,
                message: "Valid report type and item name are required."
            });
        }

        const insertReport = db.prepare(`
            INSERT INTO reports (
                type, itemName, brand, category, color,
                fromCity, toCity, eventDate, eventTime,
                location, busNumber, description, photo,
                latitude, longitude, email, currentUser, status
            )
            VALUES (
                @type, @itemName, @brand, @category, @color,
                @fromCity, @toCity, @eventDate, @eventTime,
                @location, @busNumber, @description, @photo,
                @latitude, @longitude, @email, @currentUser, @status
            )
        `);

        const result = insertReport.run({
            type,
            itemName,
            brand: brand || "",
            category: category || "",
            color: color || "",
            fromCity: fromCity || "",
            toCity: toCity || "",
            eventDate: eventDate || "",
            eventTime: eventTime || "",
            location: location || "",
            busNumber: busNumber || "",
            description: description || "",
            photo: photo || null,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
            email: email || "",
            currentUser: currentUser || "",
            status: status || "active"
        });

        const newReport = db.prepare(
            "SELECT * FROM reports WHERE id = ?"
        ).get(result.lastInsertRowid);

        res.status(201).json({
            success: true,
            message: "Report saved successfully!",
            report: newReport
        });

    } catch (error) {
        console.error("Save report error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to save report."
        });
    }
});

// Connect Node.js with Python CLIP AI
app.post(
    "/api/compare",
    upload.fields([
        { name: "lost_image", maxCount: 1 },
        { name: "found_image", maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            if (!req.files?.lost_image || !req.files?.found_image) {
                return res.status(400).json({
                    success: false,
                    message: "Please upload both lost and found images."
                });
            }

            const form = new FormData();

            form.append(
                "lost_image",
                req.files.lost_image[0].buffer,
                {
                    filename: "lost.jpg",
                    contentType: req.files.lost_image[0].mimetype
                }
            );

            form.append(
                "found_image",
                req.files.found_image[0].buffer,
                {
                    filename: "found.jpg",
                    contentType: req.files.found_image[0].mimetype
                }
            );

            const response = await axios.post(
                "http://127.0.0.1:8000/compare",
                form,
                {
                    headers: form.getHeaders()
                }
            );

            res.json(response.data);

        } catch (error) {
            console.error("AI connection error:", error.message);

            res.status(500).json({
                success: false,
                message: "Unable to connect to Python AI service."
            });
        }
    }
);

// Start server
app.listen(PORT, () => {
    console.log(
        `ReFind AI Backend running at http://localhost:${PORT}`
    );
});

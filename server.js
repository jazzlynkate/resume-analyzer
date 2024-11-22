const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const pdfParse = require("pdf-parse");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files (e.g., index.html, CSS, JS)
app.use(express.static(path.join(__dirname, "resume-analyzer")));

// PDF analysis endpoint
app.post("/analyze", async (req, res) => {
    try {
        const { fileContent } = req.body; // Base64 encoded file content

        if (!fileContent) {
            return res.status(400).send({ error: "No file content provided." });
        }

        // Decode the Base64 content
        const buffer = Buffer.from(fileContent, "base64");

        // Extract text using pdf-parse
        const pdfData = await pdfParse(buffer);
        const text = pdfData.text;

        // Separate Education and Experience
        const educationSection = extractSection(text, ["education", "degree", "bachelor", "master", "phd"]);
        const experienceSection = extractSection(text, ["experience", "role", "job", "position"]);

        // Extract Years
        const educationYears = extractYears(educationSection);
        const experienceYears = extractYears(experienceSection);

        res.send({
            educationYears,
            experienceYears,
        });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Extract relevant sections based on keywords
function extractSection(text, keywords) {
    const lowerText = text.toLowerCase();
    const relevantLines = lowerText
        .split("\n")
        .filter((line) => keywords.some((keyword) => line.includes(keyword)));
    return relevantLines.join("\n");
}

// Extract years from a given section
function extractYears(section) {
    const yearRegex = /\b(19|20)\d{2}\b/g; // Matches years between 1900 and 2099
    const matches = section.match(yearRegex);
    return matches ? matches : [];
}

// Catch-all route to serve index.html for unmatched routes
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "resume-analyzer", "index.html"));
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

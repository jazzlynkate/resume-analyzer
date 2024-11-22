const express = require("express");
const { PDFDocument } = require('pdf-lib'); 
const bodyParser = require("body-parser");
const cors = require("cors");
const pdfParse = require("pdf-parse");
const path = require("path");

const app = express(); // Make sure this line is present to initialize the 'app'

app.use(express.json({ limit: '30mb' }));

app.post("/analyze", async (req, res) => {
    try {
        const { fileContent } = req.body; // Base64 encoded file content

        if (!fileContent) {
            return res.status(400).send({ error: "No file content provided." });
        }

        // Decode the Base64 content and log buffer length
        const buffer = Buffer.from(fileContent, "base64");
        console.log("Buffer length:", buffer.length);

        // Load the PDF document
        const pdfDoc = await PDFDocument.load(buffer);

        // Extract all text from the PDF
        const pages = pdfDoc.getPages();
        let extractedText = "";
        pages.forEach((page) => {
            extractedText += page.getTextContent().join("\n");
        });

        console.log("Extracted text:", extractedText.substring(0, 100)); // Log first 100 chars

        if (!extractedText.trim()) {
            return res.status(400).send({ error: "No text found in PDF. Is this a scanned document?" });
        }

        // Split text into sections
        const sections = splitSections(extractedText);

        // Calculate scores
        const lengthScore = calculateLengthScore(extractedText);
        const keywordScore = calculateKeywordScore(extractedText);
        const educationScore = calculateEducationScore(sections["Education"]);
        const experienceScore = calculateExperienceScore(sections["Experience"]);

        // Total score
        const totalScore = lengthScore + keywordScore + educationScore + experienceScore;

        res.send({
            lengthScore,
            keywordScore,
            educationScore,
            experienceScore,
            totalScore,
        });
    } catch (error) {
        console.error("Error analyzing resume:", error.message, error.stack);
        res.status(500).send({ error: "Internal server error.", details: error.message });
    }
});

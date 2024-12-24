const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

// Load or initialize sets
let data = fs.existsSync("sets.json") ? JSON.parse(fs.readFileSync("sets.json")) : {};

// Endpoint to fetch all sets
app.get("/sets", (req, res) => {
    res.json(data);
});

// Endpoint to create a new set
app.post("/create-set", (req, res) => {
    const { names } = req.body;
    const setName = `set-${Date.now()}`;
    data[setName] = names;
    fs.writeFileSync("sets.json", JSON.stringify(data, null, 2));
    res.json({ setName });
});

// Endpoint to shuffle and pick a winner
app.post("/shuffle/:setName", (req, res) => {
    const setName = req.params.setName;

    if (!data[setName] || data[setName].length === 0) {
        return res.status(400).json({ error: "Set is empty or does not exist." });
    }

    const shuffled = [...data[setName]].sort(() => Math.random() - 0.5);
    const winner = shuffled[0];
    const remaining = shuffled.slice(1);

    data[setName] = remaining;
    fs.writeFileSync("sets.json", JSON.stringify(data, null, 2));

    res.json({ winner, remaining });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

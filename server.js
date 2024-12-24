const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let data = fs.existsSync("sets.json") ? JSON.parse(fs.readFileSync("sets.json")) : {};
let pastData = fs.existsSync("pastSets.json") ? JSON.parse(fs.readFileSync("pastSets.json")) : {};

// Save a new set
app.post("/save-set", (req, res) => {
    const { names } = req.body;
    const setName = `set-${Date.now()}`;
    data[setName] = names;
    fs.writeFileSync("sets.json", JSON.stringify(data, null, 2));
    res.sendStatus(200);
});

// Get a specific set by name
app.get("/get-set/:setName", (req, res) => {
    const { setName } = req.params;

    // Check if the set exists
    if (!data[setName]) {
        return res.status(404).json({ error: "Set not found" });
    }

    res.json({ names: data[setName] });
});

// Get all sets
app.get("/get-sets", (req, res) => {
    res.json(data);
});

// Get past sets
app.get("/get-past-sets", (req, res) => {
    fs.readFile('pastSets.json', 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading past sets:", err);
            return res.status(500).json({ error: "Failed to retrieve past sets" });
        }
        res.json(JSON.parse(data));
    });
});

// Edit a set name
app.post("/edit-set", (req, res) => {
    const { oldSetName, newSetName } = req.body;

    if (!oldSetName || !newSetName) {
        return res.status(400).send("Invalid request. 'oldSetName' and 'newSetName' are required.");
    }

    if (!data[oldSetName]) {
        return res.status(404).send("Set not found.");
    }

    data[newSetName] = data[oldSetName];
    delete data[oldSetName];
    fs.writeFileSync("sets.json", JSON.stringify(data, null, 2));
    res.sendStatus(200);
});

// Delete a set or all sets
app.post("/delete-set", (req, res) => {
    const { setName } = req.body;

    if (!setName) {
        return res.status(400).send("Set name is required.");
    }

    if (setName === 'all') {
        // Delete all sets
        data = {};
        fs.writeFileSync("sets.json", JSON.stringify(data, null, 2));
        return res.status(200).send("All sets deleted successfully.");
    }

    if (data[setName]) {
        // Delete a specific set
        delete data[setName];
        fs.writeFileSync("sets.json", JSON.stringify(data, null, 2));
        return res.status(200).send(`Set '${setName}' deleted successfully.`);
    } else {
        return res.status(404).send("Set not found.");
    }
});

// Shuffle a set and select a winner
app.post("/shuffle/:setName", (req, res) => {
    const setName = req.params.setName;

    // Check if the set exists and is not empty
    if (!data[setName] || data[setName].length === 0) {
        return res.status(400).json({ error: "Set is empty or does not exist." });
    }

    // If only one participant left, directly pick them as the winner
    if (data[setName].length === 1) {
        const winner = data[setName][0];

        // Add the winner to pastData for the current set
        if (!pastData[setName]) {
            pastData[setName] = [];
        }
        pastData[setName].push(winner);

        // Remove the set and update files
        delete data[setName];
        try {
            fs.writeFileSync("sets.json", JSON.stringify(data, null, 2));
            fs.writeFileSync("pastSets.json", JSON.stringify(pastData, null, 2));
        } catch (err) {
            return res.status(500).json({ error: "Failed to update files." });
        }

        // Respond with the winner and "Chitti finished!" message
        return res.json({ message: "Chitti finished!", winner, remaining: [] });
    }

    // Shuffle the current participants for more than one participant
    const shuffled = [...data[setName]].sort(() => Math.random() - 0.5);
    const winner = shuffled[0];
    const remaining = shuffled.slice(1);

    // Add the winner to pastData for the current set
    if (!pastData[setName]) {
        pastData[setName] = [];
    }
    pastData[setName].push(winner);

    // Update the current set with the remaining participants
    data[setName] = remaining;

    // Write updates to files
    try {
        fs.writeFileSync("sets.json", JSON.stringify(data, null, 2));
        fs.writeFileSync("pastSets.json", JSON.stringify(pastData, null, 2));
    } catch (err) {
        return res.status(500).json({ error: "Failed to update files." });
    }

    // Respond with the winner and remaining participants
    res.json({ winner, remaining });
});

// Serve the view-sets page
app.get("/view-sets", (req, res) => {
    res.sendFile(path.join(__dirname, "public/view-sets.html"));
});

// Serve the shuffle page
app.get("/shuffle-page", (req, res) => {
    res.sendFile(path.join(__dirname, "public/shuffle-page.html"));
});

// Serve the past-sets page
app.get("/past-sets", (req, res) => {
    res.sendFile(path.join(__dirname, "public/past-set.html"));
});

// Serve the index page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

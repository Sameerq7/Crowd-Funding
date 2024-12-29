const express = require("express");
const path = require("path");
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set, get, child, update, remove } = require("firebase/database");

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Firebase configuration (use your own config from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyAv8G64Fs7MWokKtSY1dy-u8t6s8e3IywY",
  authDomain: "chittiapp-fc56c.firebaseapp.com",
  projectId: "chittiapp-fc56c",
  storageBucket: "chittiapp-fc56c.appspot.com",
  messagingSenderId: "358165352945",
  appId: "1:358165352945:web:10d81e052f30f4780df450",
  measurementId: "G-ESKQ7BX2S9",
  databaseURL: "https://chittiapp-fc56c-default-rtdb.firebaseio.com/"
};

// Initialize Firebase and get the database instance
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// Save a new set
app.post("/save-set", (req, res) => {
  const { names } = req.body;
  const setName = `set-${Date.now()}`;
  const setRef = ref(db, 'sets/' + setName);

  set(setRef, { names: names })
    .then(() => res.sendStatus(200))
    .catch((error) => res.status(500).json({ error: "Failed to save set" }));
});

// Get a specific set by name
app.get("/get-set/:setName", (req, res) => {
  const { setName } = req.params;
  const setRef = ref(db, 'sets/' + setName);

  get(setRef)
    .then(snapshot => {
      if (snapshot.exists()) {
        res.json({ names: snapshot.val().names });
      } else {
        res.status(404).json({ error: "Set not found" });
      }
    })
    .catch(error => res.status(500).json({ error: "Failed to retrieve set" }));
});

// Get all sets
app.get("/get-sets", (req, res) => {
  const setsRef = ref(db, 'sets');

  get(setsRef)
    .then(snapshot => {
      if (snapshot.exists()) {
        res.json(snapshot.val());
      } else {
        res.status(404).json({ error: "No sets found" });
      }
    })
    .catch(error => res.status(500).json({ error: "Failed to retrieve sets" }));
});

app.post("/rename-set", (req, res) => {
    const { oldSetName, newSetName } = req.body;
  
    if (!oldSetName || !newSetName) {
      return res.status(400).send("Invalid request. 'oldSetName' and 'newSetName' are required.");
    }
  
    const oldSetRef = ref(db, 'sets/' + oldSetName);
    const newSetRef = ref(db, 'sets/' + newSetName);
  
    get(oldSetRef)
      .then(snapshot => {
        if (snapshot.exists()) {
          const currentSetData = snapshot.val();
  
          // Only rename the set, keeping the members unchanged
          set(newSetRef, currentSetData)
            .then(() => {
              remove(oldSetRef)
                .then(() => {
                  res.status(200).send("Set renamed successfully");
                })
                .catch(error => {
                  res.status(500).json({ error: "Failed to remove old set" });
                });
            })
            .catch(error => {
              res.status(500).json({ error: "Failed to rename set" });
            });
        } else {
          res.status(404).send("Set not found.");
        }
      })
      .catch(error => {
        res.status(500).json({ error: "Error retrieving set" });
      });
  });
  

// Get past sets
app.get("/get-past-sets", (req, res) => {
  const pastSetsRef = ref(db, 'pastSets');

  get(pastSetsRef)
    .then(snapshot => {
      if (snapshot.exists()) {
        res.json(snapshot.val());
      } else {
        res.status(404).json({ error: "No past sets found" });
      }
    })
    .catch(error => res.status(500).json({ error: "Failed to retrieve past sets" }));
});

app.post("/edit-set", (req, res) => {
    const { oldSetName, newSetName, members, deleteMembers, renameMembers } = req.body;

    if (!oldSetName) {
        return res.status(400).send("Invalid request. 'oldSetName' is required.");
    }

    const oldSetRef = ref(db, 'sets/' + oldSetName);

    get(oldSetRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                const currentSetData = snapshot.val();
                let currentMembers = currentSetData.names || [];

                // Delete members
                if (deleteMembers && Array.isArray(deleteMembers) && deleteMembers.length > 0) {
                    currentMembers = currentMembers.filter(member => !deleteMembers.includes(member));
                }

                // Rename members
                if (renameMembers && Array.isArray(renameMembers)) {
                    renameMembers.forEach(({ oldName, newName }) => {
                        const memberIndex = currentMembers.indexOf(oldName);
                        if (memberIndex !== -1) {
                            currentMembers[memberIndex] = newName;  // Rename the member
                        }
                    });
                }

                // Add new members
                if (members && Array.isArray(members) && members.length > 0) {
                    members.forEach(member => {
                        if (!currentMembers.includes(member)) {
                            currentMembers.push(member); // Add new member if not already in the set
                        }
                    });
                }

                // Save updated set with members
                set(oldSetRef, { names: currentMembers })
                    .then(() => {
                        res.status(200).send("Set updated successfully.");
                    })
                    .catch(error => {
                        console.error("Error updating set:", error);
                        res.status(500).json({ error: "Failed to update set" });
                    });
            } else {
                res.status(404).send("Set not found.");
            }
        })
        .catch(error => {
            console.error("Error retrieving set:", error);
            res.status(500).json({ error: "Error retrieving set" });
        });
});



// Delete a set or all sets
app.post("/delete-set", (req, res) => {
  const { setName } = req.body;

  if (!setName) {
    return res.status(400).send("Set name is required.");
  }

  if (setName === 'all') {
    // Delete all sets
    const setsRef = ref(db, 'sets');
    set(setsRef, {})
      .then(() => res.status(200).send("All sets deleted successfully."))
      .catch(error => res.status(500).json({ error: "Failed to delete sets" }));
  } else {
    const setRef = ref(db, 'sets/' + setName);
    remove(setRef)  // Delete the specific set
      .then(() => res.status(200).send(`Set '${setName}' deleted successfully.`))
      .catch(error => res.status(500).json({ error: "Failed to delete set" }));
  }
});

// Shuffle a set and select a winner
app.post("/shuffle/:setName", (req, res) => {
  const setName = req.params.setName;
  const setRef = ref(db, 'sets/' + setName);

  get(setRef)
    .then(snapshot => {
      if (!snapshot.exists()) {
        return res.status(400).json({ error: "Set is empty or does not exist." });
      }

      const shuffled = [...snapshot.val().names].sort(() => Math.random() - 0.5);
      const winner = shuffled[0];
      const remaining = shuffled.slice(1);

      const pastSetsRef = ref(db, 'pastSets/' + setName);
      get(pastSetsRef)
        .then(pastSnapshot => {
          const pastData = pastSnapshot.exists() ? pastSnapshot.val() : [];
          pastData.push(winner);
          set(pastSetsRef, pastData);

          set(setRef, { names: remaining });

          res.json({ winner, remaining });
        })
        .catch(error => res.status(500).json({ error: "Failed to update past sets" }));
    })
    .catch(error => res.status(500).json({ error: "Failed to shuffle set" }));
});

// Serve the pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

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

app.get('/edit-set.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'edit-set.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

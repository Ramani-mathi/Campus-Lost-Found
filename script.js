const API_URL =
    "https://us5yg7ahycckf4topdnk6erqu40nhhei.lambda-url.ap-southeast-2.on.aws/";

const form = document.getElementById("itemForm");
const message = document.getElementById("message");
const loadItemsButton = document.getElementById("loadItems");
const itemsContainer = document.getElementById("itemsContainer");


// ==========================================
// REPORT LOST / FOUND ITEM
// ==========================================

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const item = {
        type: document.getElementById("type").value,
        item_name: document.getElementById("item_name").value,
        category: document.getElementById("category").value,
        color: document.getElementById("color").value,
        location: document.getElementById("location").value,
        date: document.getElementById("date").value,
        description: document.getElementById("description").value
    };

    message.textContent = "Submitting...";

    try {

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(item)
        });

        const data = await response.json();

        if (response.ok) {

            message.textContent =
                "✅ Item reported successfully!";

            form.reset();

        } else {

            message.textContent =
                "❌ Error: " + data.error;
        }

    } catch (error) {

        console.error(error);

        message.textContent =
            "❌ Could not connect to the server.";
    }
});


// ==========================================
// LOAD REPORTED ITEMS
// ==========================================

loadItemsButton.addEventListener("click", async function () {

    itemsContainer.innerHTML = "Loading items...";

    try {

        const response = await fetch(API_URL);

        const data = await response.json();

        if (!response.ok) {

            itemsContainer.innerHTML =
                "❌ Could not load items.";

            return;
        }

        displayItems(data.items);

    } catch (error) {

        console.error(error);

        itemsContainer.innerHTML =
            "❌ Could not connect to the server.";
    }
});


// ==========================================
// DISPLAY ITEMS
// ==========================================

function displayItems(items) {

    if (!items || items.length === 0) {

        itemsContainer.innerHTML =
            "<p>No items have been reported yet.</p>";

        return;
    }

    itemsContainer.innerHTML = "";

    items.forEach(function (item) {

        const card = document.createElement("div");

        card.className = "item-card";

        card.innerHTML = `
            <h3>${item.item_name}</h3>

            <p>
                <strong>Status:</strong>
                ${item.type}
            </p>

            <p>
                <strong>Category:</strong>
                ${item.category}
            </p>

            <p>
                <strong>Color:</strong>
                ${item.color}
            </p>

            <p>
                <strong>Location:</strong>
                ${item.location}
            </p>

            <p>
                <strong>Date:</strong>
                ${item.date}
            </p>

            <p>
                <strong>Description:</strong>
                ${item.description}
            </p>
        `;

        itemsContainer.appendChild(card);
    });
}

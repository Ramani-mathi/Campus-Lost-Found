const API_URL =
    "https://us5yg7ahycckf4topdnk6erqu40nhhei.lambda-url.ap-southeast-2.on.aws/";


const form =
    document.getElementById("itemForm");

const message =
    document.getElementById("message");

const loadItemsButton =
    document.getElementById("loadItems");

const itemsContainer =
    document.getElementById("itemsContainer");

const findMatchesButton =
    document.getElementById("findMatches");

const matchItemId =
    document.getElementById("matchItemId");

const matchResult =
    document.getElementById("matchResult");

const imageInput =
    document.getElementById("image");


// ==================================================
// IMAGE VISUAL FINGERPRINT - dHASH
// ==================================================

async function createImageHash(file) {

    return new Promise(
        function (resolve, reject) {

            const reader =
                new FileReader();

            reader.onload =
                function (event) {

                    const image =
                        new Image();

                    image.onload =
                        function () {

                            /*
                             * dHash uses a 33 x 32 image.
                             *
                             * Each row compares
                             * neighbouring pixels.
                             *
                             * 32 rows x 32 comparisons
                             * = 1024 visual bits.
                             */

                            const width = 33;
                            const height = 32;

                            const canvas =
                                document.createElement(
                                    "canvas"
                                );

                            canvas.width =
                                width;

                            canvas.height =
                                height;

                            const ctx =
                                canvas.getContext(
                                    "2d",
                                    {
                                        willReadFrequently: true
                                    }
                                );

                            ctx.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );

                            const imageData =
                                ctx.getImageData(
                                    0,
                                    0,
                                    width,
                                    height
                                );

                            const pixels =
                                imageData.data;

                            const grayscale =
                                [];

                            /*
                             * Convert image to grayscale.
                             */

                            for (
                                let y = 0;
                                y < height;
                                y++
                            ) {

                                const row = [];

                                for (
                                    let x = 0;
                                    x < width;
                                    x++
                                ) {

                                    const index =
                                        (
                                            y *
                                            width +
                                            x
                                        ) * 4;

                                    const r =
                                        pixels[index];

                                    const g =
                                        pixels[index + 1];

                                    const b =
                                        pixels[index + 2];

                                    /*
                                     * Standard grayscale
                                     * luminance calculation.
                                     */

                                    const gray =
                                        Math.round(
                                            0.299 * r +
                                            0.587 * g +
                                            0.114 * b
                                        );

                                    row.push(gray);
                                }

                                grayscale.push(
                                    row
                                );
                            }


                            /*
                             * Compare neighbouring
                             * pixels.
                             *
                             * If left pixel is brighter
                             * than right pixel → 1
                             *
                             * Otherwise → 0
                             */

                            const bits = [];

                            for (
                                let y = 0;
                                y < height;
                                y++
                            ) {

                                for (
                                    let x = 0;
                                    x < width - 1;
                                    x++
                                ) {

                                    if (
                                        grayscale[y][x] >
                                        grayscale[y][x + 1]
                                    ) {

                                        bits.push(1);

                                    }

                                    else {

                                        bits.push(0);

                                    }
                                }
                            }


                            /*
                             * Convert every 4 bits
                             * into one hexadecimal
                             * character.
                             */

                            let hash = "";

                            for (
                                let i = 0;
                                i < bits.length;
                                i += 4
                            ) {

                                let value = 0;

                                for (
                                    let j = 0;
                                    j < 4;
                                    j++
                                ) {

                                    value =
                                        (
                                            value << 1
                                        ) |
                                        (
                                            bits[i + j] ||
                                            0
                                        );
                                }

                                hash +=
                                    value.toString(
                                        16
                                    );
                            }


                            resolve(hash);
                        };


                    image.onerror =
                        function () {

                            reject(
                                new Error(
                                    "Could not read image."
                                )
                            );

                        };


                    image.src =
                        event.target.result;
                };


            reader.onerror =
                function () {

                    reject(
                        new Error(
                            "Could not process image."
                        )
                    );

                };


            reader.readAsDataURL(file);
        }
    );
}



// ==================================================
// READ IMAGE AS BASE64
// ==================================================

async function readImageAsBase64(file) {

    return new Promise(
        function (resolve, reject) {

            const reader =
                new FileReader();

            reader.onload =
                function () {

                    resolve(
                        reader.result
                    );

                };

            reader.onerror =
                function () {

                    reject(
                        new Error(
                            "Could not read image."
                        )
                    );

                };

            reader.readAsDataURL(file);
        }
    );
}



// ==================================================
// REPORT ITEM
// ==================================================

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const imageFile =
            imageInput
                ? imageInput.files[0]
                : null;


        /*
         * Maximum image size:
         * 2 MB
         */

        if (
            imageFile &&
            imageFile.size >
            2 * 1024 * 1024
        ) {

            message.innerHTML =
                `
                ❌ Image is too large.
                Please choose an image smaller
                than 2 MB.
                `;

            return;
        }


        const item = {

            type:
                document.getElementById(
                    "type"
                ).value,

            item_name:
                document.getElementById(
                    "item_name"
                ).value,

            category:
                document.getElementById(
                    "category"
                ).value,

            color:
                document.getElementById(
                    "color"
                ).value,

            location:
                document.getElementById(
                    "location"
                ).value,

            date:
                document.getElementById(
                    "date"
                ).value,

            description:
                document.getElementById(
                    "description"
                ).value,

            /*
             * These will remain empty
             * when the user has no image.
             */

            image_base64: "",

            image_content_type: "",

            image_hash: ""
        };


        message.innerHTML =
            "Preparing item...";


        try {

            /*
             * If an image is available,
             * create both:
             *
             * 1. Base64 image
             * 2. Visual fingerprint
             */

            if (imageFile) {

                message.innerHTML =
                    "Processing image...";


                const imageBase64 =
                    await readImageAsBase64(
                        imageFile
                    );


                const imageHash =
                    await createImageHash(
                        imageFile
                    );


                item.image_base64 =
                    imageBase64;


                item.image_content_type =
                    imageFile.type;


                item.image_hash =
                    imageHash;
            }


            message.innerHTML =
                "Submitting item...";


            const response =
                await fetch(
                    API_URL,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                item
                            )
                    }
                );


            const data =
                await response.json();


            if (response.ok) {

                const savedItem =
                    data.item;


                message.innerHTML = `

                    <strong>
                        ✅ Item reported successfully!
                    </strong>

                    <br><br>

                    <strong>
                        Item ID:
                    </strong>

                    ${savedItem.item_id}

                    <br><br>

                    <strong>
                        Type:
                    </strong>

                    ${savedItem.type}

                    <br>

                    ${
                        imageFile
                            ? `
                            <strong>
                                🖼️ Image fingerprint created.
                            </strong>

                            <br>
                            `
                            : `
                            <strong>
                                📋 No image provided.
                                Parameter-based matching
                                will be used.
                            </strong>

                            <br>
                            `
                    }

                    <strong>
                        Smart matching is now available.
                    </strong>

                `;


                /*
                 * Automatically put ID into
                 * Smart Match search box.
                 */

                matchItemId.value =
                    savedItem.item_id;


                /*
                 * Reset form after
                 * successful submission.
                 */

                form.reset();

            }

            else {

                message.innerHTML =
                    "❌ Error: " +
                    (
                        data.error ||
                        data.message ||
                        "Unable to submit item."
                    );

            }

        }

        catch (error) {

            console.error(
                "SUBMISSION ERROR:",
                error
            );

            message.innerHTML =
                "❌ Could not connect to AWS.";

        }

    }
);



// ==================================================
// SMART MATCH
// ==================================================

findMatchesButton.addEventListener(
    "click",
    async function () {

        const itemId =
            matchItemId.value.trim();


        if (!itemId) {

            matchResult.innerHTML =
                `
                <p>
                    Please enter an Item ID.
                </p>
                `;

            return;

        }


        matchResult.innerHTML =
            "🔍 Finding possible matches...";


        try {

            const response =
                await fetch(
                    API_URL +
                    "?item_id=" +
                    encodeURIComponent(
                        itemId
                    )
                );


            const data =
                await response.json();


            if (!response.ok) {

                matchResult.innerHTML =
                    `
                    <p>
                        ❌ Item not found.
                    </p>
                    `;

                return;

            }


            displayMatches(
                data.matches
            );

        }

        catch (error) {

            console.error(
                "MATCH ERROR:",
                error
            );

            matchResult.innerHTML =
                `
                <p>
                    ❌ Could not connect to AWS.
                </p>
                `;

        }

    }
);



// ==================================================
// DISPLAY SMART MATCHES
// ==================================================

function displayMatches(matches) {


    if (
        !matches ||
        matches.length === 0
    ) {

        matchResult.innerHTML =
            `
            <div class="match-card">

                <h3>
                    No possible matches found
                </h3>

                <p>
                    The system could not find
                    a matching opposite-type item.
                </p>

            </div>
            `;

        return;

    }


    matchResult.innerHTML =
        `
        <h3>
            Possible Matches
        </h3>
        `;


    /*
     * Show highest matches first.
     *
     * Lambda will return the matches
     * in descending order.
     */

    matches.forEach(
        function (match) {

            const score =
                Number(
                    match.match_score || 0
                );


            let level;


            if (score >= 80) {

                level =
                    "High Similarity";

            }

            else if (score >= 60) {

                level =
                    "Potential Match";

            }

            else {

                level =
                    "Low Similarity";

            }


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "match-card";


            /*
             * Image similarity information.
             */

            let imageSimilarityHTML =
                "";


            if (
                match.image_similarity !==
                null &&
                match.image_similarity !==
                undefined
            ) {

                const imageSimilarity =
                    Number(
                        match.image_similarity
                    );


                imageSimilarityHTML = `

                
                    <p>
                        <strong>
                            🖼️ Image Similarity:
                        </strong>

                        ${imageSimilarity}%
                    </p>

                `;
            }

            else {

                imageSimilarityHTML = `


                    <p>
                        <strong>
                            🖼️ Image Similarity:
                        </strong>

                        Not available
                    </p>

                `;
            }


            /*
             * Parameter score.
             */

            let parameterScoreHTML =
                "";


            if (
                match.parameter_score !==
                undefined
            ) {

                parameterScoreHTML = `

                    <p>
                        <strong>
                            📋 Parameter Score:
                        </strong>

                        ${match.parameter_score}%
                    </p>

                `;
            }


            /*
             * Matching method.
             */

            let methodHTML =
                "";


            if (
                match.match_method
            ) {

                methodHTML = `

                    <p>
                        <strong>
                            Matching Method:
                        </strong>

                        ${match.match_method}
                    </p>

                `;
            }


            /*
             * Actual matched parameters.
             */

            let reasonsHTML =
                "";


            if (
                match.match_reasons &&
                match.match_reasons.length > 0
            ) {

                reasonsHTML = `

                    <div class="match-reasons">

                        <strong>
                            Matching Details:
                        </strong>

                        <ul>

                            ${
                                match.match_reasons
                                    .map(
                                        function (reason) {

                                            return `
                                                <li>
                                                    ${reason}
                                                </li>
                                            `;
                                        }
                                    )
                                    .join("")
                            }

                        </ul>

                    </div>

                `;
            }


            /*
             * Image.
             */

            let imageHTML =
                "";


            if (
                match.image_url
            ) {

                imageHTML = `

                    <div class="match-image">

                        <img
                            src="${match.image_url}"
                            alt="Matched item image"
                            style="
                                width: 100%;
                                max-width: 300px;
                                border-radius: 10px;
                                margin-bottom: 15px;
                            "
                        >

                    </div>

                `;
            }


            card.innerHTML = `

                <h3>
                    ${match.item_name || "Unnamed Item"}
                </h3>

                <span class="score">

                    ${score}% — ${level}

                </span>


                <div class="match-bar">

                    <div
                        class="match-progress"
                        style="width: ${Math.min(
                            score,
                            100
                        )}%"
                    ></div>

                </div>


                ${imageHTML}


                ${imageSimilarityHTML}


                ${parameterScoreHTML}


                ${methodHTML}


                ${reasonsHTML}


                <p>
                    <strong>
                        Type:
                    </strong>

                    ${match.type || ""}
                </p>


                <p>
                    <strong>
                        Category:
                    </strong>

                    ${match.category || ""}
                </p>


                <p>
                    <strong>
                        Color:
                    </strong>

                    ${match.color || ""}
                </p>


                <p>
                    <strong>
                        Location:
                    </strong>

                    ${match.location || ""}
                </p>


                <p>
                    <strong>
                        Date:
                    </strong>

                    ${match.date || ""}
                </p>


                <p>
                    <strong>
                        Description:
                    </strong>

                    ${match.description || ""}
                </p>


                <p>
                    <strong>
                        Item ID:
                    </strong>

                    ${match.item_id || ""}
                </p>

            `;


            matchResult.appendChild(
                card
            );

        }
    );

}



// ==================================================
// LOAD REPORTED ITEMS
// ==================================================

loadItemsButton.addEventListener(
    "click",
    async function () {

        itemsContainer.innerHTML =
            "Loading reported items...";


        try {

            const response =
                await fetch(
                    API_URL
                );


            const data =
                await response.json();


            if (!response.ok) {

                itemsContainer.innerHTML =
                    "❌ Could not load items.";

                return;

            }


            displayItems(
                data.items
            );

        }

        catch (error) {

            console.error(
                "LOAD ITEMS ERROR:",
                error
            );

            itemsContainer.innerHTML =
                "❌ Could not connect to AWS.";

        }

    }
);



// ==================================================
// DISPLAY REPORTED ITEMS
// ==================================================

function displayItems(items) {


    if (
        !items ||
        items.length === 0
    ) {

        itemsContainer.innerHTML =
            `
            <p>
                No items reported yet.
            </p>
            `;

        return;

    }


    itemsContainer.innerHTML =
        "";


    items.forEach(
        function (item) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "item-card";


            const statusClass =
                item.type === "lost"
                    ? "status-lost"
                    : "status-found";


            /*
             * Display image if available.
             */

            let imageHTML =
                "";


            if (
                item.image_url
            ) {

                imageHTML = `

                    <div
                        class="item-image"
                        style="
                            margin-bottom: 15px;
                        "
                    >

                        <img
                            src="${item.image_url}"
                            alt="Reported item image"
                            style="
                                width: 100%;
                                max-width: 300px;
                                border-radius: 10px;
                            "
                        >

                    </div>

                `;
            }


            card.innerHTML = `

                ${imageHTML}


                <h3>
                    ${item.item_name || "Unnamed Item"}
                </h3>


                <p>
                    <strong>
                        Status:
                    </strong>

                    <span
                        class="${statusClass}"
                    >
                        ${
                            item.type
                                ? item.type.toUpperCase()
                                : ""
                        }
                    </span>
                </p>


                <p>
                    <strong>
                        Category:
                    </strong>

                    ${item.category || ""}
                </p>


                <p>
                    <strong>
                        Color:
                    </strong>

                    ${item.color || ""}
                </p>


                <p>
                    <strong>
                        Location:
                    </strong>

                    ${item.location || ""}
                </p>


                <p>
                    <strong>
                        Date:
                    </strong>

                    ${item.date || ""}
                </p>


                <p>
                    <strong>
                        Description:
                    </strong>

                    ${item.description || ""}
                </p>


                <p>
                    <strong>
                        Item ID:
                    </strong>

                    ${item.item_id || ""}
                </p>

            `;


            itemsContainer.appendChild(
                card
            );

        }
    );

}

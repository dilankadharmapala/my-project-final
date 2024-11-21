let model;
let tryAgainTimeout;  // To keep track of the timeout for the "try again" button
let countdownInterval; // To manage the countdown for the "try again" button

// Load the model when the page loads
async function loadModel() {
    try {
        console.log("Loading model...");
        // Update this path to the location of your model on your local server
        model = await tf.loadLayersModel('/model/model.json');
        console.log("Model Loaded");
    } catch (error) {
        console.error("Error loading the model:", error);
    }
}

// Start the skin analysis (with messages before the analysis starts)
async function startAnalysis() {
    let startButton = document.getElementById('start-button');
    startButton.style.display = 'none'; // Hide button after starting analysis

    console.log("Starting message display...");
    // Display a series of messages
    displayMessages();
}

// Function to display a series of messages one after another
function displayMessages() {
    const messages = [
        "Ready to find the real you?",
        "We’re getting everything ready...",
        "Hold tight, this won’t take long!",
        "Analyzing your skin type...",
        "Getting your results..."
    ];

    let analyzingText = document.getElementById('analyzing-text');
    let index = 0;

    function showMessage() {
        analyzingText.textContent = messages[index];
        analyzingText.style.display = 'block'; // Show the message
        console.log("Message displayed: " + messages[index]); // Log the message being displayed
        index++;

        // Show next message after a delay (1.5 seconds for each message)
        if (index < messages.length) {
            setTimeout(showMessage, 1500);
        } else {
            // Once all messages are shown, start the analysis
            console.log("All messages shown. Starting analysis...");
            analyzeSkin();
        }
    }

    // Start showing the messages
    showMessage();
}

// Function to analyze the skin using webcam input (replace with actual model prediction)
async function analyzeSkin() {
    console.log("Starting skin analysis...");

    if (!model) {
        console.error("Model not loaded yet!");
        return; // Don't proceed with analysis if the model isn't loaded
    }

    const video = document.getElementById('video');
    const result = document.getElementById('result');
    const analyzingText = document.getElementById('analyzing-text');
    const tryAgainButton = document.getElementById('try-again-button');

    // Capture a frame from the video to be used for analysis
    const img = tf.browser.fromPixels(video);

    // Resize the image to the correct size: 224x224 (the original model input size)
    const resizedImage = tf.image.resizeBilinear(img, [224, 224]);

    // Normalize the image (scale the pixel values to [0, 1] by dividing by 255)
    const input = resizedImage.expandDims(0).toFloat().div(tf.scalar(255));  // Normalize image

    try {
        // Get the prediction from the model
        const predictions = await model.predict(input).data();

        // Get the class with the highest probability
        const predictedClass = predictions.indexOf(Math.max(...predictions));

        // Display the skin type based on prediction
        if (predictedClass === 0) {
            result.textContent = 'Your skin type is: Normal';
        } else if (predictedClass === 1) {
            result.textContent = 'Your skin type is: Oily';
        } else {
            result.textContent = 'Your skin type is: Dry';
        }

        // Hide the analyzing text after result is displayed
        analyzingText.style.display = 'none';

    } catch (error) {
        console.error("Error during prediction:", error);
    } finally {
        img.dispose();  // Clean up memory
        result.style.display = 'block'; // Show the result after analysis

        // Show the "try again" button for 8 seconds with countdown
        tryAgainButton.style.display = 'inline-block';
        startCountdown(); // Start the countdown
    }
}

// Start the countdown for the "Try Again" button
function startCountdown() {
    const tryAgainButton = document.getElementById('try-again-button');
    let timeLeft = 8; // Countdown time in seconds

    // Create a span element for the countdown numbers
    const countdownSpan = document.createElement('span');
    countdownSpan.classList.add('countdown');  // Apply the countdown class
    tryAgainButton.innerHTML = `Try Again `;  // Reset button content without the extra "("
    tryAgainButton.appendChild(countdownSpan);  // Append the span element to the button
    countdownSpan.textContent = timeLeft; // Display the initial countdown number

    countdownInterval = setInterval(() => {
        timeLeft--;
        countdownSpan.textContent = timeLeft;  // Update the countdown number

        // Stop the countdown when it reaches 0
        if (timeLeft <= 0) {
            clearInterval(countdownInterval); // Stop the countdown
            tryAgainButton.style.display = 'none'; // Hide the button after countdown
            replaceWebcamWithRectangle(); // Replace webcam with a white rectangle
        }
    }, 1000); // Update every second
}

// Function to replace webcam with a white rectangle
function replaceWebcamWithRectangle() {
    const videoContainer = document.getElementById('video-container');
    const videoElement = document.getElementById('video');
    
    // Hide the webcam
    videoElement.style.display = 'none';

    // Create a white rectangle
    const whiteRectangle = document.createElement('div');
    whiteRectangle.style.width = '100%';
    whiteRectangle.style.height = '300px';  // Adjust height as needed
    whiteRectangle.style.backgroundColor = '#fff';
    whiteRectangle.style.borderRadius = '8px';
    whiteRectangle.style.border = '2px solid #432812';  // Match border style of the webcam
    whiteRectangle.setAttribute('id', 'white-rectangle');
    
    // Append the white rectangle to the video container
    videoContainer.appendChild(whiteRectangle);
}

// Function to restart the analysis when "try again" button is clicked
function tryAgain() {
    const result = document.getElementById('result');
    const analyzingText = document.getElementById('analyzing-text');
    const tryAgainButton = document.getElementById('try-again-button');
    const startButton = document.getElementById('start-button');

    // Reset the result text and hide it
    result.style.display = 'none';

    // Show the start button again to begin the process
    startButton.style.display = 'block';

    // Hide the "try again" button
    tryAgainButton.style.display = 'none';

    // Reset the analyzing text
    analyzingText.style.display = 'block';
    analyzingText.textContent = "Ready to find the real you?";  // Or you can reset it to the first message

    // Call startAnalysis again to start the process from the beginning
    startAnalysis();
}

// Event listener for the start button to begin the analysis
document.getElementById('start-button').addEventListener('click', startAnalysis);

// Event listener for the "try again" button to restart the process
document.getElementById('try-again-button').addEventListener('click', tryAgain);

// Set up webcam (input video stream)
navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        const video = document.getElementById('video');
        video.srcObject = stream;
    })
    .catch((error) => {
        console.error("Error accessing webcam: ", error);
    });

// Load the model when the page loads
window.onload = loadModel;
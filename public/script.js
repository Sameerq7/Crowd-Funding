// Assuming this is part of your existing JavaScript code

document.addEventListener("DOMContentLoaded", function() {
    // Function to find an element by its text content
    function findElementByText(container, text) {
        const elements = container.querySelectorAll('.set h3');
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].textContent === text) {
                return elements[i];
            }
        }
        return null;
    }

    // Assuming you have a container where your sets are listed
    const container = document.querySelector('.sets-container'); // or another container selector
    const setName = 'set-1734979860053'; // replace with dynamic set name if needed
    const element = findElementByText(container, setName);

    if (element) {
        // Do something with the found element (e.g., show an alert)
        alert('Found the element!');
    } else {
        alert('Element not found!');
    }
});

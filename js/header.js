// Create a section for the menu
const container = document.createElement("section");
container.className = "container-menu";

// Create a logo element separately
const logo = document.createElement("a");
logo.href = "index.html";

// Create a navigation menu
const menu = document.createElement("nav");
menu.innerHTML = `
    <ul>
        <li><a href="index.html" class="menu-item">Home</a></li>
        <li><a href="drug.html" class="menu-item">Drug Tests</a></li>
        <li><a href="seatbelt-section.html" class="menu-item">Seatbelt Fines</a></li>
        <li><a href="car-crash.html" class="menu-item">Car Crashes</a></li>
    </ul>
`;

// Add both elements to the container
container.appendChild(logo); // Append the logo first
container.appendChild(menu); // Append the menu after

// Append the container to the document body
document.body.prepend(container);

// Add the yellow box styling
const currentPath = window.location.pathname.split("/").pop();
const menuItems = document.querySelectorAll(".menu-item");

menuItems.forEach(item => {
    if (item.getAttribute("href") === currentPath) {
        const highlightBox = document.createElement("div");
        highlightBox.style.background = "rgba(34, 130, 247, 0.55)"; // Light yellow background
        highlightBox.style.borderRadius = "30px";
        highlightBox.style.position = "absolute";
        highlightBox.style.top = "-48%"; 
        highlightBox.style.left = "-28%";
        highlightBox.style.width = "150%";
        highlightBox.style.height = "200%";
        highlightBox.style.zIndex = "-1";
        item.style.position = "relative";
        item.appendChild(highlightBox);
    }
});

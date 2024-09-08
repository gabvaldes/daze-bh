const monsters = [
    { name: "Golden Thief Bug", minRespawn: 60, maxRespawn: 70, map: "map-gtb.png" },
    { name: "Tao Gunka", minRespawn: 300, maxRespawn: 310, map: "map-tao-gunka.png" },
    { name: "Memory of Thanatos", minRespawn: 120, maxRespawn: 120, map: "map-thana.png" },
    { name: "Gloom Under Night", minRespawn: 300, maxRespawn: 310, map: "map-gloom.png" },
    { name: "Fallen Bishop Hibram", minRespawn: 120, maxRespawn: 130, map: "map-hibram.png" },
    { name: "Ifrit", minRespawn: 660, maxRespawn: 670, map: "map-ifrit.png" },
    { name: "Valkyrie Randgris", minRespawn: 480, maxRespawn: 490, map: "map-valk.png" },
    { name: "Berzebub", minRespawn: 720, maxRespawn: 730, map: "map-beez.png" },
    { name: "LHZ3", minRespawn: 180, maxRespawn: 210, map: "map-lhz3.png" },
];

const tableBody = document.querySelector('#monsterTable tbody');

let tombstonePositions = {}; // Store tombstone positions for each map

function saveData() {
    const data = [];
    tableBody.querySelectorAll('tr').forEach(row => {
        const monsterName = row.children[0].textContent;
        const deathTime = row.querySelector('.death-time').value;
        const xCoordinate = row.querySelector('.x-coordinate').value;
        const yCoordinate = row.querySelector('.y-coordinate').value;

        data.push({ monsterName, deathTime, xCoordinate, yCoordinate });
    });
    localStorage.setItem('monsterTrackerData', JSON.stringify(data));
}

function loadData() {
    const data = JSON.parse(localStorage.getItem('monsterTrackerData'));
    if (data) {
        data.forEach((item, index) => {
            const row = tableBody.children[index];
            row.querySelector('.death-time').value = item.deathTime;
            row.querySelector('.x-coordinate').value = item.xCoordinate;
            row.querySelector('.y-coordinate').value = item.yCoordinate;

            if (item.deathTime) {
                const monster = monsters[index];
                const deathTime = new Date(item.deathTime);
                const minRespawnTime = new Date(deathTime.getTime() + monster.minRespawn * 60000);
                const maxRespawnTime = new Date(deathTime.getTime() + monster.maxRespawn * 60000);

                const respawnTimeFormatted = formatTimeRange(minRespawnTime, maxRespawnTime);
                row.querySelector('.respawn-time').textContent = respawnTimeFormatted;

                // Start countdown for the loaded data
                startCountdown(row, minRespawnTime);
            }
        });
        sortTableByRespawnTime();
    }
}

function openMapModal(mapSrc) {
    const mapModal = document.getElementById("mapModal");
    const mapImage = document.getElementById("mapImage");
    mapImage.src = mapSrc;
    mapModal.style.display = "block";

    const currentMap = tombstonePositions[mapSrc] || { left: '50%', top: '50%' };
    const tombstoneElement = document.getElementById("tombstone");
    tombstoneElement.style.left = currentMap.left;
    tombstoneElement.style.top = currentMap.top;

    mapImage.dataset.mapSrc = mapSrc;
}

const tombstone = document.getElementById("tombstone");

tombstone.addEventListener('dragstart', dragStart);
document.querySelector('.map-container').addEventListener('dragover', dragOver);
document.querySelector('.map-container').addEventListener('drop', drop);

function dragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.id);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const tombstoneId = e.dataTransfer.getData("text/plain");
    const tombstoneElement = document.getElementById(tombstoneId);
    const mapImage = document.getElementById("mapImage");

    const offsetX = e.offsetX - (tombstoneElement.offsetWidth / 2);
    const offsetY = e.offsetY - (tombstoneElement.offsetHeight / 2);

    tombstoneElement.style.left = `${offsetX}px`;
    tombstoneElement.style.top = `${offsetY}px`;

    // Save tombstone position for the current map
    const mapSrc = mapImage.dataset.mapSrc;
    tombstonePositions[mapSrc] = { left: tombstoneElement.style.left, top: tombstoneElement.style.top };

    saveTombstonePositions();
}

function saveTombstonePositions() {
    localStorage.setItem('tombstonePositions', JSON.stringify(tombstonePositions));
}

function loadTombstonePositions() {
    const storedPositions = JSON.parse(localStorage.getItem('tombstonePositions'));
    if (storedPositions) {
        tombstonePositions = storedPositions;
    }
}

function startCountdown(row, minRespawnTime) {
    const timeRemainingCell = row.querySelector('.time-remaining');

    function updateCountdown() {
        const now = new Date();
        const timeRemaining = Math.max(0, minRespawnTime - now);

        const hours = Math.floor(timeRemaining / (1000 * 60 * 60)).toString().padStart(2, '0');
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000).toString().padStart(2, '0');

        timeRemainingCell.textContent = `${hours}:${minutes}:${seconds}`;

        if (timeRemaining > 0) {
            requestAnimationFrame(updateCountdown);
        } else {
            timeRemainingCell.textContent = "Respawned";
        }
    }

    updateCountdown();
}

document.addEventListener('DOMContentLoaded', function () {
    loadTombstonePositions();

    const closeButton = document.querySelector(".close");
    const mapModal = document.getElementById("mapModal");

    // Ensure close button works when clicked
    closeButton.onclick = function () {
        mapModal.style.display = "none";
    };

    // Also close the modal when clicking outside of the modal content
    window.onclick = function (event) {
        if (event.target == mapModal) {
            mapModal.style.display = "none";
        }
    };

    monsters.forEach(monster => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${monster.name}</td>
            <td>${monster.minRespawn} - ${monster.maxRespawn} minutes</td>
            <td><input type="datetime-local" class="death-time"></td>
            <td><input type="number" class="x-coordinate" placeholder="X"></td>
            <td><input type="number" class="y-coordinate" placeholder="Y"></td>
            <td class="respawn-time"></td>
            <td class="time-remaining"></td>
            <td><button class="map-button" data-map-src="${monster.map}">Map</button></td>
        `;

        row.querySelector('.death-time').addEventListener('change', function () {
            const deathTime = new Date(this.value);
            const minRespawnTime = new Date(deathTime.getTime() + monster.minRespawn * 60000);
            const maxRespawnTime = new Date(deathTime.getTime() + monster.maxRespawn * 60000);

            const now = new Date();
            const timeRemainingMin = Math.max(0, minRespawnTime - now);
            const timeRemainingMax = Math.max(0, maxRespawnTime - now);

            const respawnTimeFormatted = formatTimeRange(minRespawnTime, maxRespawnTime);
            row.querySelector('.respawn-time').textContent = respawnTimeFormatted;

            // Start countdown
            startCountdown(row, minRespawnTime);

            saveData();
            sortTableByRespawnTime(); // Sort the table after updating respawn times
        });

        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', saveData);
        });

        row.querySelector('.map-button').addEventListener('click', function () {
            openMapModal(this.dataset.mapSrc);
        });

        tableBody.appendChild(row);
    });

    loadData();
});

function sortTableByRespawnTime() {
    const rows = Array.from(tableBody.children);
    rows.sort((a, b) => {
        const timeA = a.querySelector('.time-remaining').textContent;
        const timeB = b.querySelector('.time-remaining').textContent;

        // Convert HH:MM:SS to seconds
        const secondsA = timeA === "Respawned" ? 0 : timeStringToSeconds(timeA);
        const secondsB = timeB === "Respawned" ? 0 : timeStringToSeconds(timeB);

        return secondsA - secondsB;
    });

    rows.forEach(row => tableBody.appendChild(row));
}

function timeStringToSeconds(timeString) {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}

function formatTimeRange(minTime, maxTime) {
    const minHours = minTime.getHours() % 12 || 12;
    const minMinutes = minTime.getMinutes().toString().padStart(2, '0');
    const minPeriod = minTime.getHours() >= 12 ? 'PM' : 'AM';

    const maxHours = maxTime.getHours() % 12 || 12;
    const maxMinutes = maxTime.getMinutes().toString().padStart(2, '0');
    const maxPeriod = maxTime.getHours() >= 12 ? 'PM' : 'AM';

    return `${minHours}:${minMinutes} ${minPeriod} - ${maxHours}:${maxMinutes} ${maxPeriod}`;
}
(() => {
    
    // Initialize piggy and ensure single instance
    const ID = "piggy-babe";
    if (document.getElementById(ID)){
        return;
    }
    const pig = document.createElement("div");
    pig.id = ID;

    // group piggy body parts together for movement
    pig.innerHTML = `
        <div class="ear left"></div>
        <div class="ear right"></div>
        <div class="head">
        <div class="eye left"></div>
        <div class="eye right"></div>
        <div class="snout">
            <div class="nostril left"></div>
            <div class="nostril right"></div>
        </div>
        </div>
        <div class="body"></div>
        <div class="foot left"></div>
        <div class="foot right"></div>
        <div class="tail"></div>
    `;

    document.body.appendChild(pig);

    let x = 20;
    let dir = 1;                 // 1 = right, -1 = left
    const speed = 0.6;           // px per frame
    const margin = 12;

    function walk() {
        const vw = window.innerWidth;
        const pigWidth = pig.offsetWidth || 64;
        const minX = margin;
        const maxX = vw - pigWidth - margin;

        x += dir * speed;

        if (x >= maxX) {
        x = maxX;
        dir = -1;
        pig.classList.add("flip");
        } else if (x <= minX) {
        x = minX;
        dir = 1;
        pig.classList.remove("flip");
        }

        pig.style.left = `${x}px`;
        requestAnimationFrame(walk);
    }

    requestAnimationFrame(walk);
})();

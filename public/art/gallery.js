////////////////////////////////////////////////////////////////////////////////////////////////
//
// module of JS functions for werewolf-girlfriend's (https://werewolf-girlfriend.neocities.org) gallery template!
// use with the corresponding HTML and CSS templates for best results
//
// huge inspiration from https://mawchine.neocities.org/archive 's picrew repository
// and huge help with the lightbox from https://webdesign.tutsplus.com/build-an-interactive-image-gallery-with-html-css-and-javascript--cms-107881t
//
////////////////////////////////////////////////////////////////////////////////////////////////


////////// GLOBALS

// tags
let activeTags = [];

// lightbox
let items = [];
let totalItems = 0;
let currentIndex = 0;


////////// EVENT LISTENERS

// populate globals and add event listeners to elements
document.addEventListener('DOMContentLoaded', function () {
    items = document.querySelectorAll(".item");
    totalItems = items.length;
    document.getElementById('item-counter').innerText = `total: ${totalItems}`;

    // tags
    document.querySelectorAll(".tag").forEach(tag => {
        tag.addEventListener('click', handleTagClick);
        tag.innerText = tag.title;
    });

    document.querySelector("#reset").addEventListener('click', reset);

    // lightbox
    items.forEach(item => {
        item.addEventListener('click', openLightbox);
    });

    document.querySelector("#close-btn").addEventListener('click', closeLightbox);

    document.querySelector("#prev-btn").addEventListener('click', changeItemEvent);
    document.querySelector("#next-btn").addEventListener('click', changeItemEvent);

    // to top button
    document.querySelector("#to-top-btn").addEventListener('click', toTop);
});

// keyboard navigation for lightbox (left/right arrow keys)
document.addEventListener('keydown', function (e) {
    if (document.getElementById('lightbox').style.display === 'block') {
        if (e.key === 'ArrowLeft') {
            _changeItem(-1);
        } else if (e.key === 'ArrowRight') {
            _changeItem(1);
        }
    }
});

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {scrollFunction()};


////////// ACTUAL FUNCTIONS

// TAGS

function handleTagClick(event) {
    let tag = event.currentTarget.title;
    if (activeTags.includes(tag)) {
        // if tag is already in activeTags then 
        // remove it from there and hide those items
        const index = activeTags.indexOf(tag);
        activeTags.splice(index, 1);
        _colorTagButton(tag, "remove");
    } else {
        // if tag is not in activeTags then 
        // add it there and show those items
        activeTags.push(tag);
        _colorTagButton(tag, "add");
    }
    _toggleItems();

    if (activeTags.length == 0) {
        _showAll();
    }
}

function _colorTagButton(tag, action) {
    // adds or removes .active to button element of selected tag
    const cur = document.querySelector(`.tag[title="${tag}"]`);
    if (action === "add") {
        cur.classList.add('active');
    } else if (action === "remove") {
        cur.classList.remove('active');
    }
}

function _toggleItems() {
    // clicked tag is now removed from the active tags, 
    // hide all items that dont have any selected tags
    // and recalc items array

    // get all items
    items = document.querySelectorAll(".item");

    // get only elements with active tags
    let newItems = [];
    items.forEach(item => {
        let tags = item.getAttribute('data-tags').split(' ');

        //// this condition vvv shows every item with at least 1 selected tag (OR-logic)
        // if (tags.some(val => activeTags.includes(val))) {
        //     item.classList.remove('hidden');
        //     newItems.push(item);

        //// this condition vvv only shows items that match all selected tags (AND-logic)
        //// which probably makes more sense for a filtering system
        if (activeTags.every(val => tags.includes(val))) {
            item.classList.remove('hidden');
            newItems.push(item);
        } else {
            // none of item's tags are in activeTags = dont show
            item.classList.add('hidden');
        }
    });

    // thats now the new items
    items = newItems;
    totalItems = items.length;
    document.getElementById('item-counter').innerText = `total: ${totalItems}`;
}

function _showAll() {
    // resets items and totalItems
    items = document.querySelectorAll(".item");
    totalItems = items.length;
    document.getElementById('item-counter').innerText = `total: ${totalItems}`;

    // and removes .hidden from all .item elements
    items.forEach(item => {
        item.classList.remove('hidden');
    });
}

function reset() {
    activeTags.forEach(tag => {
        _colorTagButton(tag, "remove");
    });
    activeTags = [];
    _showAll();
}


// LIGHTBOX

// Open the lightbox
function openLightbox(event) {
    if (event.currentTarget.classList.contains("item")) {
        const clickedIndex = Array.from(items).indexOf(event.currentTarget);
        currentIndex = clickedIndex;
        _updateLightbox();
        document.getElementById('lightbox').style.display = 'block';
    }
}

// Close the lightbox
function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
}

// Update the lightbox image and thumbnails
function _updateLightbox() {
    const LBimg = document.querySelector("#lightbox-img img");
    const LBtitle = document.querySelector("#lightbox-title");
    const LBdate = document.querySelector("#lightbox-date");
    const LBdesc = document.querySelector("#lightbox-desc");
    const LBtags = document.querySelector("#lightbox-tags");

    // Update the the contents of the lightbox
    if (items[currentIndex].querySelector(".item-img") != null) {
        LBimg.src = items[currentIndex].querySelector(".item-img").src;
        LBimg.alt = items[currentIndex].querySelector(".item-img").alt;
    } else {
        LBimg.src = "";
        LBimg.alt = "";
    }

    _updateInfo(LBtitle, ".item-title");
    _updateInfo(LBdate, ".item-date");
    _updateInfo(LBdesc, ".item-desc");

    // tags
    // https://stackoverflow.com/questions/28256271/populate-ul-in-html-with-json-data
    LBtags.innerHTML = "";
    let tags = items[currentIndex].getAttribute('data-tags').split(" ");
    for (let i = 0; i < tags.length; i++) { 
        const tag = tags[i];
        const li = document.createElement("li");
        li.appendChild(document.createTextNode(tag));
        LBtags.appendChild(li);
    }
    _updateProgress();
}

// updates the innerHTML of lightbox info divs
function _updateInfo(LB_el, item_el) {
    if (items[currentIndex].querySelector(item_el) != null) {
        LB_el.innerHTML = items[currentIndex].querySelector(item_el).innerHTML;
        } else {LB_el.innerHTML = "";}
}

// update lil "(current)/(total amount of images)" tally
function _updateProgress() {
    const progress = document.querySelector("#progress");
    progress.innerHTML = `${currentIndex+1}/${totalItems}`;
}

function changeItemEvent(event) {
    if (event.currentTarget.id === "prev-btn") {
        _changeItem(-1);
    } else if (event.currentTarget.id === "next-btn") {
        _changeItem(1);
    }
}

// Change the lightbox image based on direction (1 for next, -1 for prev)
function _changeItem(direction) {
    currentIndex += direction;

    // loop around at edge
    if (currentIndex >= totalItems) {
        currentIndex = 0;
    } else if (currentIndex < 0) {
        currentIndex = totalItems - 1;
    }

    _updateLightbox();
}


// TO TOP BUTTON

function scrollFunction() {
    const toTopBtn = document.getElementById('to-top-btn');
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        toTopBtn.style.display = "block";
    } else {
        toTopBtn.style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the document
function toTop() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}
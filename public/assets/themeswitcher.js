// Holiday override
window.addEventListener("DOMContentLoaded", function() {
    if (getCookie("theme") == "") {
        changeStyle("/assets/spoopy.css");
        document.cookie = "theme=spoopy; max-age=31536000; path=/";
    }
});

// Set up stylesheet changer 9000
function changeStyle(newStyle) {
    document.getElementById('pageStyle').setAttribute('href', newStyle);
}

// Apply style and save cookie if yes
function applyStyle() {
    var picked = this.value;
    console.log("Theme selected:", picked);

    if (picked == 'light') {
        changeStyle('');
        document.cookie = "theme=light; max-age=31536000; path=/";
    } else if (picked == 'dark') {
        changeStyle('/assets/dark.css');
        document.cookie = "theme=dark; max-age=31536000; path=/";
    } else if (picked == 'spoopy') {
        changeStyle('/assets/spoopy.css');
        document.cookie = "theme=spoopy; max-age=31536000; path=/";
    }

    window.location.reload();
}

// Get and set preferred user theme on load
window.onload = function getPrefs() {
    const theme = getCookie("theme");
    const dropdown = document.getElementById('themeSelect');

    if (theme == "light") {
        changeStyle("");
        dropdown.value = "light";
    } else if (theme == "dark") {
        changeStyle("/assets/dark.css");
        dropdown.value = "dark";
    } else if (theme == "spoopy") {
        changeStyle("/assets/spoopy.css");
        dropdown.value = "spoopy";
    }
};

// Code for getting cookie by name shamelessly stolen from w3schools 🫃
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// Check if dropdown has changed
document.getElementById('themeSelect').onchange = applyStyle;

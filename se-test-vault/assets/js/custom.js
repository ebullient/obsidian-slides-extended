/* Custom script for testing scripts frontmatter option */
console.log("[slides-extended] custom.js loaded");

document.addEventListener("DOMContentLoaded", function () {
    var items = document.querySelectorAll(".scripted");
    for (var i = 0; i < items.length; i++) {
        items[i].setAttribute("data-scripted", "true");
    }
});

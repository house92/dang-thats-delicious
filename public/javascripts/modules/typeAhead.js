import axios from "axios";
import dompurify from "dompurify";

function searchResultsHTML(stores) {
    return stores.map(store => {
        return `
            <a href="/stores/${store.slug}" class="search__result">
                <strong>${store.name}</strong>
            </a>
        `;
    }).join("");
}

export default function typeAhead(search) {
    if (!search) return;

    const searchInput = search.querySelector("input[name='search']");
    const searchResults = search.querySelector(".search__results");

    searchInput.on("input", function () {
        if (!this.value) {
            searchResults.style.display = "none";
            return;
        }

        searchResults.style.display = "block";
        searchResults.innerHTML = "";
        axios
        .get(`/api/search?q=${this.value}`)
        .then(res => {
            if (res.data.length) {
                searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
                return;
            } else {
                searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results for ${this.value} found</div>`);
            }
        })
        .catch(err => {
            console.error(err);
        });
    });

    // Handle keyboard inputs
    searchInput.on("keyup", (e) => {
        if  (![38, 40, 13].includes(e.keyCode)) return;

        const activeClass = "search__result--active";
        const current = search.querySelector(`.${activeClass}`);
        const items = search.querySelectorAll(".search__result");
        let next;
        if (e.keyCode == 40) {
            if (current) {
                next = current.nextElementSibling || items[0];
            } else {
                next = items[0];
            }
        } else if (e.keyCode == 38) {
            if (current) {
                next = current.previousElementSibling || items[items.length - 1];
            } else {
                next = items[items.length - 1];
            }
        } else {
            if (current) {
                window.location = current.href;
            }
        }
        if (current) {
            current.classList.remove(activeClass);
        }
        next.classList.add(activeClass);
    });
}

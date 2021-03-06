const TRIES = 6;



function create_reveal(artist, type) {
    let elem = document.createElement("div");
    elem.innerText = artist;
    elem.Text = artist;
    elem.classList.add(type);
    elem.classList.add("reveal");
    elem.classList.add("flip");
    return elem;
}

// function to check guesses, called by user input
function check_guess() {
    let guess_input = document.getElementById("artist_guess");
    let guess = guess_input.value;

    check_guessed_artist(guess);

    // misc to be able to restore the progress
    const stored = parseInt(localStorage.getItem("last_played")) || 0;
    if (stored != movlie_number()) {
        // a new day
        localStorage.setItem("last_played", movlie_number());
        let guesses = [];
        guesses.push(guess);
        localStorage.setItem("guesses", JSON.stringify(guesses));
        return;
    } else {
        // add the guess to the list
        let guesses = JSON.parse(localStorage.getItem("guesses")) || [];
        guesses.push(guess)
        localStorage.setItem("guesses", JSON.stringify(guesses));
    }
}

// guess is the name of the artist, any case
// can be called when restoring progress
async function check_guessed_artist(guess) {
    let guess_lowercase = guess.toLowerCase();
    let names_lowercase = names.map(x => x.toLowerCase());

    if (guess == "") {
        flash("No input");
        return;
    } else if (!names_lowercase.includes(guess_lowercase)) {
        flash("This artist is not in the list");
        return;
    } else if (current_guess == TRIES) {
        flash("Riperino");
        return;
    }

    let guess_div = document.getElementById("guess" + current_guess);
    guess_div.innerHTML = "";

    if (guess_lowercase == solution.toLowerCase()) {
        let a = create_reveal(guess, "right");
        guess_div.appendChild(a);

        // show all the image in full
        for (let i = 0; i < 6; ++i) {
            reveal_clue(i);
        }
        
        const last_won = parseInt(localStorage.getItem("last_won")) || 0;
        // only update the statistics if we didnt refresh
        // (the first time this is reached)
        if (last_won != movlie_number()) {

            // update the statistics 
            let stats = ["played", "win", "streak", "max-streak"];
            for (var stat of stats) {
                const stored = parseInt(localStorage.getItem(stat)) || 0;
                localStorage.setItem(stat, stored + 1);
            }
            let total = parseInt(localStorage.getItem("total-" + current_guess)) || 0;
            localStorage.setItem("total-"+current_guess, total + 1);

            // store the current day
            localStorage.setItem("last_won", movlie_number()); 
        }
        document.getElementById("total-graph-"+current_guess).classList.add("highlight");
        document.getElementById("stats-footer").classList.remove("hide");

        update_statistics();   

        await new Promise(r => setTimeout(r, 2000));
        let modal = document.getElementById("stats_modal")
        modal.style.display = "block";


    } else {
        let a = create_reveal(guess, "wrong");
        guess_div.appendChild(a);
    }

    current_guess += 1;

    // reset the input
    document.getElementById("artist_guess").value = "";


    if (current_guess == TRIES && guess_lowercase != solution.toLowerCase()) {
        // Riperino
        localStorage.setItem("last_lost", movlie_number()); 
        let stored = parseInt(localStorage.getItem("played")) || 0;
        localStorage.setItem("played", stored + 1);
        stored = parseInt(localStorage.getItem("streak")) || 0;
        localStorage.setItem("streak", 0);

        display_solution();
    } else if (guess_lowercase != solution.toLowerCase()){
        // dont do this if we got the solution
        reveal_clue(current_guess);
    }
}

async function display_solution() {
    await new Promise(r => setTimeout(r, 1000));
    document.getElementById("solution-container").classList.remove("hide");

    let guess_div = document.getElementById("solution")
    guess_div.innerHTML = solution;
}

function update_statistics() {
    let stats = ["played", "streak", "max-streak"];

    for (var stat of stats) {
        const stored = parseInt(localStorage.getItem(stat)) || 0;
        let div = document.getElementById(stat);
        div.innerText = stored;
    }

    let played = parseInt(localStorage.getItem("played")) || 0;
    let win = parseInt(localStorage.getItem("win")) || 0;
    let div = document.getElementById("win");
    if (played == 0) {
        div.innerText = 0;
    } else {
        div.innerText = Math.round((100 * win) / played);
    }

    for (var i = 0; i < TRIES ; ++i) {
        let total = parseInt(localStorage.getItem("total-"+i)) || 0;
        let percent = 7;
        if (total != 0) {
            percent = ((100 * total) / played);
        }
        let div = document.getElementById("total-"+i);
        div.innerText = total;
        div = document.getElementById("total-graph-"+i);
        div.style.width = "" + percent + "%";
    }
}

function countdown() {
    setInterval(function() {
        var now = new Date();
        const date = new Date();  
        date.setDate(now.getDate() + 1); // tomorrow
        date.setUTCHours(0, 0, 0, 0);  // go by utc
        now = now.getTime();
        var distance = date - now;

        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const zeroPad = (num, places) => String(num).padStart(places, '0')
        minutes = zeroPad(minutes, 2);
        seconds = zeroPad(seconds, 2);
        document.getElementsByTagName("countdown-timer")[0].innerText = `${hours}:${minutes}:${seconds}`;
    }, 1000);
}

function share() {
    let message = "Artistle.org ";

    let day = movlie_number();
    message += "#" + day + " " + current_guess + "/6\n";
    updateClipboard(message);
    flash("Copied to clipboard");
}

function show_image(id) {
    let img = document.getElementById("clue" + id);
    img.src = "/images/" + solution_imdb + "/" + id + "-medi.jpg"
}

function reveal_clue(index) {
    show_image(index);
    let elements = document.getElementsByClassName("hidden-container");
    for (let el of elements) {
        el.classList = "hidden-container"; // reset
        el.classList.add("clue" + index);
    }
}

function setup_zoomers() {
    return; // disable
    let clues = ["clue0", "clue1", "clue2", "clue3", "clue4", "clue5"];
    for (let clue of clues) {
        let img = document.getElementById(clue);
        img.onclick = function(e) {
            document.getElementById(clue).classList.toggle("zoomer");
	    }
    }
}

async function main() {
    // setup global variables like todays solution
    await setup_globals();
    setup_zoomers();

    show_image(0);

    // dont use votes anymore for random votes
    //window.votes = await get_votes(solution_imdb);
    //votes = votes.Votes; // array of votes corresponding to screenshot votes


    // guess by click on guess
    let button = document.getElementById("submit");
    button.addEventListener('click', check_guess);

    // guess by enter (keyCode 13)
    const input = document.getElementById("artist_guess");
    input.addEventListener('keypress', event => {
        if (event.keyCode == 13) {
            check_guess();
        }
    });

    update_statistics();
    restore_progress();

    // initialize the statistics
    let played = parseInt(localStorage.getItem("played")) || 0;
    if (played == 0) {
        let modal = document.getElementById("help_modal")
        modal.style.display = "block";
    }

    // share button listener
    button = document.getElementById("share-button");
    button.addEventListener('click', share);

    countdown();
}
main()


function restore_progress() {
    const stored = parseInt(localStorage.getItem("last_played")) || 0;

    if (stored != movlie_number()) {
        // new day, nothing to do here
        return;
    }
    let guesses = JSON.parse(localStorage.getItem("guesses")) || [];
    for (let g of guesses) {
        check_guessed_artist(g);
    }
}
new autoComplete({
    selector: '#artist_guess',
    minChars: 2,
    source: function(term, suggest){
        term = term.toLowerCase();
        var choices = artists;
        var suggestions = [];
        for (i=0;i<choices.length;i++)
            if (~choices[i].name.toLowerCase().indexOf(term)) {
                suggestions.push(choices[i]);
            }
        suggest(suggestions);
    },
    renderItem: function (item, search) {
        search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
        return '<div class="autocomplete-suggestion" data-imdb="'+item.id+'" data-name="'+item.name+'" data-val="'+search+'">'+item.name.replace(re, "<b>$1</b>")+'</div>';
    },
    onSelect: function(e, term, item) {
        document.getElementById("artist_guess").value = item.getAttribute("data-name");
    }
});

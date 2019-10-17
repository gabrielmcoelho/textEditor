/* ========================================================== */
/* ===================== INITIALIZATION ===================== */
/* ========================================================== */

/* Build HTML element */
let editor = document.querySelector('#looq-editor');
editor.innerHTML = '<div class="editor-container"><div class="editor-backdrop"><pre class="code-formatter line-numbers"><code class="language-r code-wrapper"></code></pre></div><textarea class="code-editor" spellcheck="false"></textarea></div><div class="pull-right"><select class="language-selector"></select></div>';
let codeFormatter = editor.querySelector('pre.code-formatter');
let backdrop = editor.querySelector('div.editor-backdrop');
let codeEditor = editor.querySelector('textarea.code-editor');
let codeWrapper = editor.querySelector('code.code-wrapper');
let languageSelector = editor.querySelector('select.language-selector');

let languageOptions = [
    {
        prismAlias: 'r',
        displayName: 'R'
    },
    {
        prismAlias: 'json',
        displayName: 'JSON'
    },
    {
        prismAlias: 'py',
        displayName: 'Python'
    },
    {
        prismAlias: 'html',
        displayName: 'HTML'
    },
];

for(var i=0; i<languageOptions.length; i++) {
    var option = document.createElement("option");
    option.innerHTML = languageOptions[i].displayName;
    option.setAttribute("value", languageOptions[i].prismAlias);
    languageSelector.appendChild(option);
}

codeWrapper.textContent = " ";

/* ========================================================== */
/* ==================== EDITOR FUNCTIONS ==================== */
/* ========================================================== */

/* reverse a string using built in functions */
function reverseString(originalString) {
    // Step 1. Use the split() method to return a new array
    var splitString = originalString.split("");

    // Step 2. Use the reverse() method to reverse the new created array
    var reversedArray = splitString.reverse();

    // Step 3. Use the join() method to join all elements of the array into a string
    var reversedString = reversedArray.join("");

    return reversedString;
}

/* count the number of lines selected by user */
function countSelectedLines(selectionStart, selectionEnd) {
    return (
        (codeEditor.value.substring(selectionStart, selectionEnd)
            .match(/\n/g) || []).length + 1
    )
}

/* find the beginning of the line where the selection starts */
function findBeginningOfLine(selectionStart) {
    var stringUntilCaret = codeEditor.value.substring(0, selectionStart);
    var reversedStr = reverseString(stringUntilCaret);
    // the position of the beginning of the line will be just after the first line break
    if(reversedStr.search("\n") === -1) return 0; // if there's no line break, then it's the first line
    return selectionStart - reversedStr.search("\n");
}

/* find the end of the line where the selection ends */
function findEndOfLine(selectionEnd) {
    return codeEditor.value.substring(selectionEnd).search('\n') === -1 ? codeEditor.value.length
        : codeEditor.value.substring(selectionEnd).search('\n') + selectionEnd;
}

/* decides whether or not a selected block of lines should be commented */
function shouldComment(affectedLines) {
    // separate the selected block into lines, and analyse each one individually
    var separatedLines = affectedLines.split("\n");
    /* decides if a given line should be commented */
    function helper(line) {
        return line.search(/[^\s#\t]/) === -1 ? false
            : line.search("#") === -1 ? true
                : line.search(/[^\s#\t]/) < line.search("#");
    }
    for(var i=0; i<separatedLines.length; i++){
        // if one line should be commented, all the block should too
        if(helper(separatedLines[i])){
            return true;
        }
    }
    return false;
}

/* at the beginning of each line, add a comment symbol (by default is '#') */
function addComments(string){
    return "# " + string.replace(/(?:\r\n|\r|\n)/g, "\n# ");
}

/* at the beginning of each line, remove a comment symbol (by default is '#') */
function removeComments(affectedLines){
    var separatedLines = affectedLines.split("\n");
    for(var i=0; i<separatedLines.length; i++){
        if((separatedLines[i].charAt(separatedLines[i].search("#") + 1)) === " "){
            separatedLines[i] = separatedLines[i].replace("# ", "");
        }
        else if((separatedLines[i].charAt(separatedLines[i].search("#") + 1)) === "\t"){
            separatedLines[i] = separatedLines[i].replace("#\t", "   ");
        }
        else{
            separatedLines[i] = separatedLines[i].replace("#", "");
        }
    }
    return separatedLines.join("\n");
}

/* at the beginning of each line, add a indentation '\t' */
function addIndentation(string){
    return "\t" + string.replace(/(?:\r\n|\r|\n)/g, "\n\t");
}

/* at the beginning of each line, remove indentation '\t' */
function removeIndentation(string){
    return string.replace("\t", "").replace(/(?:\r\n|\r|\n)\t/g, "\n");
}

function contains(selector, text) {
    var elements = this.editor.querySelectorAll(selector);
    return [].filter.call(elements, function(element){
        return RegExp(text).test(element.textContent);
    });
}

/* ========================================================== */
/* ===================== EVENT HANDLERS ===================== */
/* ========================================================== */

/* each time the textarea value changes, reflect that to backdrop and apply highlights again */
function handleEditorInput() {
    var text = codeEditor.value;
    codeWrapper.textContent = text + "\r\n";
    Prism.highlightAll();
    handleEditorScroll();
}

/* align textarea's, backdrop's and wrapper's scrolls */
function handleEditorScroll() {
    backdrop.scrollTop = codeEditor.scrollTop;
    codeFormatter.scrollLeft = codeEditor.scrollLeft;
}

// TODO: Refactor handleEditorKeyDown method
function handleEditorKeyDown(e){
    var keyCode = e.keyCode || e.which;

    /* tab indentation feature */
    if (keyCode === 9) {
        e.preventDefault();

        // get information about the selected text
        var selectionStart = e.target.selectionStart;
        var selectionEnd = e.target.selectionEnd;
        var firstLineStart = findBeginningOfLine(selectionStart);
        var lineCount = countSelectedLines(selectionStart, selectionEnd);

        /* indent case */
        if(!e.shiftKey){
            /* indentation without selecting text */
            if(selectionStart === selectionEnd){
                // update the line by adding a tab where the caret is
                e.target.value = e.target.value.substring(0, selectionStart)
                    + "\t"
                    + e.target.value.substring(selectionEnd);

                // put caret at right position again
                e.target.selectionStart =
                    e.target.selectionEnd = selectionStart + 1;
            }
            /* indentation where text is selected */
            else {
                // update the selected lines by adding tabs at their beginning
                var newStrWithIndentation = addIndentation(e.target.value.substring(firstLineStart, selectionEnd));
                e.target.value = e.target.value.substring(0, firstLineStart)
                    + newStrWithIndentation
                    + e.target.value.substring(selectionEnd);

                // put caret at right position again
                e.target.selectionStart = selectionStart + 1;
                e.target.selectionEnd = selectionEnd + lineCount;
            }
        }
        /* unindent case */
        else{
            // update the selected lines by removing tabs at their beginning
            var newStrWithoutIndentation= removeIndentation(e.target.value.substring(firstLineStart, selectionEnd));
            e.target.value = e.target.value.substring(0, firstLineStart)
                + newStrWithoutIndentation
                + e.target.value.substring(selectionEnd);

            // put caret at right position again
            e.target.selectionStart = selectionStart-1;
            e.target.selectionEnd = selectionEnd - lineCount;
        }

        // reflect changes on backdrop
        handleEditorInput();
    }

    /* comment shortcut feature */
    else if ((keyCode === 67 && (e.metaKey || e.ctrlKey) && e.shiftKey) || (keyCode === 191 && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();

        // get information about the selection
        var selectionStart = e.target.selectionStart;
        var selectionEnd = e.target.selectionEnd;
        var lineCount = countSelectedLines(selectionStart, selectionEnd);
        var firstLineStart = findBeginningOfLine(selectionStart);
        var lastLineEnd = findEndOfLine(selectionEnd);

        /* comment case */
        if(shouldComment(e.target.value.substring(firstLineStart, lastLineEnd))){
            // update the selected lines by adding comment symbols at their beginning
            var newStrWithComments = addComments(e.target.value.substring(firstLineStart, selectionEnd));
            e.target.value = e.target.value.substring(0, firstLineStart)
                + newStrWithComments
                + e.target.value.substring(selectionEnd);

            // put caret at right position again
            e.target.selectionStart = selectionStart + 2;
            e.target.selectionEnd = selectionEnd + lineCount*2;
        }
        /* uncomment case */
        else{
            // update the selected lines by removing comment symbols at their beginning
            var newStrWithoutComments = removeComments(e.target.value.substring(firstLineStart, selectionEnd));
            e.target.value = e.target.value.substring(0, firstLineStart)
                + newStrWithoutComments
                + e.target.value.substring(selectionEnd);

            // put caret at right position again
            e.target.selectionStart = selectionStart - 2;
            e.target.selectionEnd = selectionEnd - lineCount*2;
        }

        // reflect changes on backdrop
        handleEditorInput();
    }

    /* duplicate shortcut feature */
    else if (keyCode === 68 && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();

        // get information about the selection
        var selectionStart = e.target.selectionStart;
        var selectionEnd = e.target.selectionEnd;

        // duplicate just current line
        if(selectionStart === selectionEnd){
            var lineStart = findBeginningOfLine(selectionStart);
            var lineEnd = findEndOfLine(selectionEnd);
            var lineContent = this.value.substring(lineStart, lineEnd);

            // insert the duplicated line into the editor
            value = e.target.value.substring(0, lineEnd)
                + '\n' + lineContent
                + e.target.value.substring(lineEnd);

            // put caret at right position again
            e.target.selectionStart = e.target.selectionEnd = selectionStart + lineEnd - lineStart + 1;
        }
        // duplicate all selected text
        else{
            var selectedContent = e.target.value.substring(selectionStart, selectionEnd);

            // insert the duplicated text into the editor
            e.target.value = e.target.value.substring(0, selectionEnd)
                + selectedContent
                + e.target.value.substring(selectionEnd);

            // put caret at right position again
            e.target.selectionStart = selectionEnd;
            e.target.selectionEnd = selectionEnd + selectionEnd - selectionStart;
        }
        // reflect changes on backdrop
        handleEditorInput();
    }

    /* ---------- Autocomplete symbols feature ---------- */
    // TODO: Autocomplete single quotes and double quotes
    else if (keyCode === 57 && e.shiftKey || keyCode === 219) {
        e.preventDefault();
        // get information about the selection
        var selectionStart = e.target.selectionStart;
        var selectionEnd = e.target.selectionEnd;

        var symbols;
        if(keyCode === 57) symbols = '()';
        else if(keyCode === 219){
            if(e.shiftKey) symbols = '{}';
            else symbols = '[]';
        }

        // insert the symbols
        e.target.value = e.target.value.substring(0, selectionStart)
            + symbols
            + e.target.value.substring(selectionEnd);

        // put caret at right position again
        e.target.selectionStart = e.target.selectionEnd = selectionStart+1;

        // reflect changes on backdrop
        handleEditorInput();
    }
}

/* applies highlights inside editor when text is selected */
function handleEditorMouseUp(e) {
    // first, remove highlights if they're present
    var elementsWithHighlight = codeWrapper.querySelectorAll('.mark');
    for(var i=0; i<elementsWithHighlight.length; i++){
        elementsWithHighlight[i].classList.remove('mark');
    }
    // then, apply highlights
    if(Math.abs(e.target.selectionEnd - e.target.selectionStart) >= 3){ // only highlight words with 3+ letters
        var selectedText = codeEditor.value.substring(e.target.selectionStart, e.target.selectionEnd);
        if(selectedText.search(/[^A-Za-z0-9]/) === -1){ // only highlight letters and numbers
            // var selector = ":contains(" + selectedText + ")";
            // var elements = codeWrapper.find(selector); // search for elements that contain the selectedText
            var elements = contains('span', selectedText);
            var textBefore, textAfter, text;
            for(i=0; i<elements.length; i++){
                // put selectedText inside span (which will give a yellow bg) and build the string again
                text = elements[i].textContent;
                textBefore = text.substring(0, text.search(selectedText));
                textAfter = text.substring(text.search(selectedText) + selectedText.length);
                // if(textBefore.search(/<[a-zA-Z]/) === -1 && textAfter.search(/<\/[a-zA-Z]/) === -1){
                elements[i].innerHTML =
                    textBefore
                    + '<span class="mark span-no-spacing">' + selectedText + '</span>' +
                    textAfter;
                // }
            }
        }
    }
}

function handleLanguageChange(e) {
    codeWrapper.removeAttribute('class');
    var newLanguage = "language-" + e.target.value;
    codeWrapper.classList.add(newLanguage);
    Prism.highlightAll();
}


/* Register listeners */
codeEditor.addEventListener("input", handleEditorInput);
codeEditor.addEventListener("scroll", handleEditorScroll);
codeEditor.addEventListener("keydown", handleEditorKeyDown);
codeEditor.addEventListener("mouseup", handleEditorMouseUp);
languageSelector.addEventListener("change", handleLanguageChange);


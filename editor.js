var backdrop = $('#editor-backdrop');
var codeFormatter = $('#code-formatter');
var codeEditor = $('#code-editor');
var codeWrapper = $('#code-wrapper');
var languageSelector = $('#language-selector');

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
        (codeEditor.val().substring(selectionStart, selectionEnd)
            .match(/\n/g) || []).length + 1
    )
}

/* find the beginning of the line where the selection starts */
function findBeginningOfLine(selectionStart) {
    var stringUntilCaret = codeEditor.val().substring(0, selectionStart);
    var reversedStr = reverseString(stringUntilCaret);
    // the position of the beginning of the line will be just after the first line break
    if(reversedStr.search("\n") === -1) return 0; // if there's no line break, then it's the first line
    return selectionStart - reversedStr.search("\n");
}

/* find the end of the line where the selection ends */
function findEndOfLine(selectionEnd) {
    return codeEditor.val().substring(selectionEnd).search('\n') === -1 ? codeEditor.val().length
        : codeEditor.val().substring(selectionEnd).search('\n') + selectionEnd;
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

/* ========================================================== */
/* ===================== EVENT HANDLERS ===================== */
/* ========================================================== */

/* each time the textarea value changes, reflect that to backdrop and apply highlights again */
function handleEditorInput() {
    var text = codeEditor.val();
    codeWrapper.text(text + "\r\n");
    Prism.highlightAll();
    codeEditor.trigger('scroll');
}

/* align textarea's, backdrop's and wrapper's scrolls */
function handleEditorScroll() {
    var scrollTop = codeEditor.scrollTop();
    backdrop.scrollTop(scrollTop);

    var scrollLeft = codeEditor.scrollLeft();
    codeFormatter.scrollLeft(scrollLeft);
}

// TODO: Refactor handleEditorKeyDown function
function handleEditorKeyDown(e){
    var keyCode = e.keyCode || e.which;

    /* tab indentation feature */
    if (keyCode === 9) {
        e.preventDefault();

        // get information about the selected text
        var selectionStart = this.selectionStart;
        var selectionEnd = this.selectionEnd;
        var firstLineStart = findBeginningOfLine(this.selectionStart);
        var lineCount = countSelectedLines(this.selectionStart, this.selectionEnd);

        /* indent case */
        if(!e.shiftKey){
            /* indentation without selecting text */
            if(selectionStart === selectionEnd){
                // update the line by adding a tab where the caret is
                $(this).val($(this).val().substring(0, selectionStart)
                    + "\t"
                    + $(this).val().substring(selectionEnd));

                // put caret at right position again
                this.selectionStart =
                    this.selectionEnd = selectionStart + 1;
            }
            /* indentation where text is selected */
            else {
                // update the selected lines by adding tabs at their beginning
                var newStrWithIndentation = addIndentation($(this).val().substring(firstLineStart, selectionEnd));
                $(this).val($(this).val().substring(0, firstLineStart)
                    + newStrWithIndentation
                    + $(this).val().substring(selectionEnd));

                // put caret at right position again
                this.selectionStart = selectionStart + 1;
                this.selectionEnd = selectionEnd + lineCount;
            }
        }
        /* unindent case */
        else{
            // update the selected lines by removing tabs at their beginning
            var newStrWithoutIndentation= removeIndentation($(this).val().substring(firstLineStart, selectionEnd));
            $(this).val($(this).val().substring(0, firstLineStart)
                + newStrWithoutIndentation
                + $(this).val().substring(selectionEnd));

            // put caret at right position again
            this.selectionStart = selectionStart-1;
            this.selectionEnd = selectionEnd - lineCount;
        }

        // reflect changes on backdrop
        $(this).trigger("input");
    }

    /* comment shortcut feature */
    else if ((keyCode === 67 && (e.metaKey || e.ctrlKey) && e.shiftKey) || (keyCode === 191 && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();

        // get information about the selection
        var selectionStart = this.selectionStart;
        var selectionEnd = this.selectionEnd;
        var lineCount = countSelectedLines(this.selectionStart, this.selectionEnd);
        var firstLineStart = findBeginningOfLine(this.selectionStart);
        var lastLineEnd = findEndOfLine(this.selectionEnd);

        /* comment case */
        if(shouldComment($(this).val().substring(firstLineStart, lastLineEnd))){
            // update the selected lines by adding comment symbols at their beginning
            var newStrWithComments = addComments($(this).val().substring(firstLineStart, selectionEnd));
            $(this).val($(this).val().substring(0, firstLineStart)
                + newStrWithComments
                + $(this).val().substring(selectionEnd));

            // put caret at right position again
            this.selectionStart = selectionStart + 2;
            this.selectionEnd = selectionEnd + lineCount*2;
        }
        /* uncomment case */
        else{
            // update the selected lines by removing comment symbols at their beginning
            var newStrWithoutComments = removeComments($(this).val().substring(firstLineStart, selectionEnd));
            $(this).val($(this).val().substring(0, firstLineStart)
                + newStrWithoutComments
                + $(this).val().substring(selectionEnd));

            // put caret at right position again
            this.selectionStart = selectionStart - 2;
            this.selectionEnd = selectionEnd - lineCount*2;
        }

        // reflect changes on backdrop
        $(this).trigger("input");
    }

    /* duplicate shortcut feature */
    else if (keyCode === 68 && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();

        // get information about the selection
        var selectionStart = this.selectionStart;
        var selectionEnd = this.selectionEnd;

        // duplicate just current line
        if(selectionStart === selectionEnd){
            var lineStart = findBeginningOfLine(selectionStart);
            var lineEnd = findEndOfLine(selectionEnd);
            var lineContent = $(this).val().substring(lineStart, lineEnd);

            // insert the duplicated line into the editor
            $(this).val($(this).val().substring(0, lineEnd)
                + '\n' + lineContent
                + $(this).val().substring(lineEnd));

            // put caret at right position again
            this.selectionStart = this.selectionEnd = selectionStart + lineEnd - lineStart + 1;
        }
        // duplicate all selected text
        else{
            var selectedContent = $(this).val().substring(selectionStart, selectionEnd);

            // insert the duplicated text into the editor
            $(this).val($(this).val().substring(0, selectionEnd)
                + selectedContent
                + $(this).val().substring(selectionEnd));

            // put caret at right position again
            this.selectionStart = selectionEnd;
            this.selectionEnd = selectionEnd + selectionEnd - selectionStart;
        }
        // reflect changes on backdrop
        $(this).trigger("input");
    }

    /* ---------- Autocomplete symbols feature ---------- */
    // TODO: Autocomplete single quotes and double quotes
    else if (keyCode === 57 && e.shiftKey || keyCode === 219) {
        e.preventDefault();
        // get information about the selection
        var selectionStart = this.selectionStart;
        var selectionEnd = this.selectionEnd;

        var symbols;
        if(keyCode === 57) symbols = '()';
        else if(keyCode === 219){
            if(e.shiftKey) symbols = '{}';
            else symbols = '[]';
        }

        // insert the symbols
        $(this).val($(this).val().substring(0, selectionStart)
            + symbols
            + $(this).val().substring(selectionEnd));

        // put caret at right position again
        this.selectionStart = this.selectionEnd = selectionStart+1;

        // reflect changes on backdrop
        $(this).trigger("input");
    }
}

/* applies highlights inside editor when text is selected */
function handleEditorMouseUp() {
    // first, remove highlights if they're present
    var marks = $(".mark");
    var elementsWithHighlight = codeWrapper.find(marks);
    for(var i=0; i<elementsWithHighlight.length; i++){
        elementsWithHighlight[i].classList.remove('mark');
    }
    // then, apply highlights
    if(Math.abs(this.selectionEnd - this.selectionStart) >= 3){ // only highlight words with 3+ letters
        var selectedText = codeEditor.val().substring(this.selectionStart, this.selectionEnd);
        if(selectedText.search(/[^A-Za-z0-9]/) === -1){ // only highlight letters and numbers
            var selector = ":contains(" + selectedText + ")";
            var elements = codeWrapper.find(selector); // search for elements that contain the selectedText
            var textBefore, textAfter, text;
            for(i=0; i<elements.length; i++){
                // put selectedText inside span (which will give a yellow bg) and build the string again
                text = elements[i].textContent;
                textBefore = text.substring(0, text.search(selectedText));
                textAfter = text.substring(text.search(selectedText) + selectedText.length);
                if(textBefore.search(/<[a-zA-Z]/) === -1 && textAfter.search(/<\/[a-zA-Z]/) === -1){
                    elements[i].innerHTML =
                        textBefore
                        + '<span class="mark span-no-spacing">' + selectedText + '</span>' +
                        textAfter;
                }
            }
        }
    }
}

/* changes editor's language highlight option */
function handleLanguageChange() {
    codeWrapper.removeAttr('class');
    var newLanguage = "language-" + $(this).val();
    $("#item").attr('class', '');
    codeWrapper.addClass(newLanguage);
    Prism.highlightAll();
}

/* ========================================================== */
/* ==================== EVENT LISTENERS ===================== */
/* ========================================================== */

codeEditor.on('input', handleEditorInput);
codeEditor.on('scroll', handleEditorScroll);
codeEditor.on('keydown', handleEditorKeyDown);
codeEditor.on('mouseup', handleEditorMouseUp);
languageSelector.on('change', handleLanguageChange);

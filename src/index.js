import Prism from 'prismjs';
import './index.css';

class Editor {

    /* ========================================================== */
    /* ===================== INITIALIZATION ===================== */
    /* ========================================================== */
    constructor(selector, config) {
        /* Build HTML element */
        this.editor = document.querySelector(selector);
        this.editor.innerHTML = '<div class="editor-container"><div class="editor-backdrop"><pre class="code-formatter line-numbers"><code class="language-r code-wrapper"></code></pre></div><textarea class="code-editor" spellcheck="false"></textarea></div><div class="pull-right"><select class="language-selector"></select></div>'
        this.codeFormatter = this.editor.querySelector('pre.code-formatter');
        this.backdrop = this.editor.querySelector('div.editor-backdrop');
        this.codeEditor = this.editor.querySelector('textarea.code-editor');
        this.codeWrapper = this.editor.querySelector('code.code-wrapper');
        this.languageSelector = this.editor.querySelector('select.language-selector');
        /* Register listeners */
        this.codeEditor.addEventListener("input", this);
        this.codeEditor.addEventListener("scroll", this);
        this.codeEditor.addEventListener("keydown", this);
        this.codeEditor.addEventListener("mouseup", this);
        this.languageSelector.addEventListener("change", this);

        this.languageOptions = [
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

        for(var i=0; i<this.languageOptions.length; i++) {
            var option = document.createElement("option");
            option.innerHTML = this.languageOptions[i].displayName;
            option.setAttribute("value", this.languageOptions[i].prismAlias);
            this.languageSelector.appendChild(option);
        }

        this.codeWrapper.textContent = " ";
    }

    /* ========================================================== */
    /* ==================== EDITOR FUNCTIONS ==================== */
    /* ========================================================== */

    /* reverse a string using built in functions */
    static reverseString(originalString) {
        // Step 1. Use the split() method to return a new array
        var splitString = originalString.split("");

        // Step 2. Use the reverse() method to reverse the new created array
        var reversedArray = splitString.reverse();

        // Step 3. Use the join() method to join all elements of the array into a string
        var reversedString = reversedArray.join("");

        return reversedString;
    }

    /* count the number of lines selected by user */
    countSelectedLines(selectionStart, selectionEnd) {
        return (
            (this.codeEditor.value.substring(selectionStart, selectionEnd)
                .match(/\n/g) || []).length + 1
        )
    }

    /* find the beginning of the line where the selection starts */
    findBeginningOfLine(selectionStart) {
        var stringUntilCaret = this.codeEditor.value.substring(0, selectionStart);
        var reversedStr = Editor.reverseString(stringUntilCaret);
        // the position of the beginning of the line will be just after the first line break
        if(reversedStr.search("\n") === -1) return 0; // if there's no line break, then it's the first line
        return selectionStart - reversedStr.search("\n");
    }

    /* find the end of the line where the selection ends */
    findEndOfLine(selectionEnd) {
        return this.codeEditor.value.substring(selectionEnd).search('\n') === -1 ? this.codeEditor.value.length
            : this.codeEditor.value.substring(selectionEnd).search('\n') + selectionEnd;
    }

    /* decides whether or not a selected block of lines should be commented */
    shouldComment(affectedLines) {
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
    addComments(string){
        return "# " + string.replace(/(?:\r\n|\r|\n)/g, "\n# ");
    }

    /* at the beginning of each line, remove a comment symbol (by default is '#') */
    removeComments(affectedLines){
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
    addIndentation(string){
        return "\t" + string.replace(/(?:\r\n|\r|\n)/g, "\n\t");
    }

    /* at the beginning of each line, remove indentation '\t' */
    removeIndentation(string){
        return string.replace("\t", "").replace(/(?:\r\n|\r|\n)\t/g, "\n");
    }

    contains(selector, text) {
        var elements = this.editor.querySelectorAll(selector);
        return [].filter.call(elements, function(element){
            return RegExp(text).test(element.textContent);
        });
    }

    /* ========================================================== */
    /* ===================== EVENT HANDLERS ===================== */
    /* ========================================================== */

    /* each time the textarea value changes, reflect that to backdrop and apply highlights again */
    handleEditorInput() {
        var text = this.codeEditor.value;
        this.codeWrapper.textContent = text + "\r\n";
        Prism.highlightAll();
        this.handleEditorScroll();
    }

    /* align textarea's, backdrop's and wrapper's scrolls */
    handleEditorScroll() {
        this.backdrop.scrollTop = this.codeEditor.scrollTop;
        this.codeFormatter.scrollLeft = this.codeEditor.scrollLeft;
    }

    // TODO: Refactor handleEditorKeyDown method
    handleEditorKeyDown(e){
        var keyCode = e.keyCode || e.which;

        /* tab indentation feature */
        if (keyCode === 9) {
            e.preventDefault();

            // get information about the selected text
            var selectionStart = e.target.selectionStart;
            var selectionEnd = e.target.selectionEnd;
            var firstLineStart = this.findBeginningOfLine(selectionStart);
            var lineCount = this.countSelectedLines(selectionStart, selectionEnd);

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
                    var newStrWithIndentation = this.addIndentation(e.target.value.substring(firstLineStart, selectionEnd));
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
                var newStrWithoutIndentation= this.removeIndentation(e.target.value.substring(firstLineStart, selectionEnd));
                e.target.value = e.target.value.substring(0, firstLineStart)
                    + newStrWithoutIndentation
                    + e.target.value.substring(selectionEnd);

                // put caret at right position again
                e.target.selectionStart = selectionStart-1;
                e.target.selectionEnd = selectionEnd - lineCount;
            }

            // reflect changes on backdrop
            this.handleEditorInput();
        }

        /* comment shortcut feature */
        else if ((keyCode === 67 && (e.metaKey || e.ctrlKey) && e.shiftKey) || (keyCode === 191 && (e.metaKey || e.ctrlKey))) {
            e.preventDefault();

            // get information about the selection
            var selectionStart = e.target.selectionStart;
            var selectionEnd = e.target.selectionEnd;
            var lineCount = this.countSelectedLines(selectionStart, selectionEnd);
            var firstLineStart = this.findBeginningOfLine(selectionStart);
            var lastLineEnd = this.findEndOfLine(selectionEnd);

            /* comment case */
            if(this.shouldComment(e.target.value.substring(firstLineStart, lastLineEnd))){
                // update the selected lines by adding comment symbols at their beginning
                var newStrWithComments = this.addComments(e.target.value.substring(firstLineStart, selectionEnd));
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
                var newStrWithoutComments = this.removeComments(e.target.value.substring(firstLineStart, selectionEnd));
                e.target.value = e.target.value.substring(0, firstLineStart)
                    + newStrWithoutComments
                    + e.target.value.substring(selectionEnd);

                // put caret at right position again
                e.target.selectionStart = selectionStart - 2;
                e.target.selectionEnd = selectionEnd - lineCount*2;
            }

            // reflect changes on backdrop
            this.handleEditorInput();
        }

        /* duplicate shortcut feature */
        else if (keyCode === 68 && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();

            // get information about the selection
            var selectionStart = e.target.selectionStart;
            var selectionEnd = e.target.selectionEnd;

            // duplicate just current line
            if(selectionStart === selectionEnd){
                var lineStart = this.findBeginningOfLine(selectionStart);
                var lineEnd = this.findEndOfLine(selectionEnd);
                var lineContent = this.value.substring(lineStart, lineEnd);

                // insert the duplicated line into the editor
                this.value = e.target.value.substring(0, lineEnd)
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
            this.handleEditorInput();
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
            this.handleEditorInput();
        }
    }

    /* applies highlights inside editor when text is selected */
    handleEditorMouseUp(e) {
        // first, remove highlights if they're present
        var elementsWithHighlight = this.codeWrapper.querySelectorAll('.mark');
        for(var i=0; i<elementsWithHighlight.length; i++){
            elementsWithHighlight[i].classList.remove('mark');
        }
        // then, apply highlights
        if(Math.abs(e.target.selectionEnd - e.target.selectionStart) >= 3){ // only highlight words with 3+ letters
            var selectedText = this.codeEditor.value.substring(e.target.selectionStart, e.target.selectionEnd);
            if(selectedText.search(/[^A-Za-z0-9]/) === -1){ // only highlight letters and numbers
                // var selector = ":contains(" + selectedText + ")";
                // var elements = codeWrapper.find(selector); // search for elements that contain the selectedText
                var elements = this.contains('span', selectedText);
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

    handleLanguageChange(e) {
        this.codeWrapper.removeAttribute('class');
        var newLanguage = "language-" + e.target.value;
        this.codeWrapper.classList.add(newLanguage);
        Prism.highlightAll();
    }

    handleEvent(e) {
        switch(e.type) {
            case "input":
                this.handleEditorInput();
                break;
            case "scroll":
                this.handleEditorScroll();
                break;
            case "keydown":
                this.handleEditorKeyDown(e);
                break;
            case "mouseup":
                this.handleEditorMouseUp(e);
                break;
            case "change":
                this.handleLanguageChange(e);
                break;
        }
    }
}

export default Editor;


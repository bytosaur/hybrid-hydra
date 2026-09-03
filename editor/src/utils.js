
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}



    // Helper function to find code blocks
    function findBlocks(lines) {
      const blocks = [];
      let currentBlock = null;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() !== "") {
          if (!currentBlock) {
            currentBlock = { start: i, end: i, code: lines[i] };
          } else {
            currentBlock.end = i;
            currentBlock.code += "\n" + lines[i];
          }
        } else {
          if (currentBlock) {
            blocks.push(currentBlock);
            currentBlock = null;
          }
        }
      }

      if (currentBlock) blocks.push(currentBlock);
      return blocks;
    }

    // Toggle comment function for JavaScript
    function toggleComment(cm) {
      const from = cm.getCursor("start");
      const to = cm.getCursor("end");
      const startLine = Math.min(from.line, to.line);
      const endLine = Math.max(from.line, to.line);
      
      // Check if all lines are commented
      let allCommented = true;
      for (let i = startLine; i <= endLine; i++) {
        const line = cm.getLine(i);
        if (line.trim() && !line.trim().startsWith('//')) {
          allCommented = false;
          break;
        }
      }
      
      // Toggle comments
      for (let i = startLine; i <= endLine; i++) {
        const line = cm.getLine(i);
        if (allCommented) {
          // Uncomment: remove '//' and following space if present
          const uncommented = line.replace(/^(\s*)\/\/\s?/, '$1');
          cm.replaceRange(uncommented, { line: i, ch: 0 }, { line: i, ch: line.length });
        } else {
          // Comment: add '//' at the start (after leading whitespace)
          const match = line.match(/^(\s*)/);
          const indent = match ? match[1] : '';
          const commented = indent + '// ' + line.slice(indent.length);
          cm.replaceRange(commented, { line: i, ch: 0 }, { line: i, ch: line.length });
        }
      }
    }

    // Editor Management
    let editors = [];
    
    // Initialize sync manager
    let syncManager = null;

    function createEditor(initialCode = '') {
      // Create editor panel wrapper
      const panel = document.createElement('div');
      panel.className = 'editor-panel';
      
      // Create editor container div
      const editorDiv = document.createElement('div');
      editorDiv.className = 'editor-content';
      panel.appendChild(editorDiv);
      
      document.getElementById('editor-container').appendChild(panel);
      
      // Get the index for this editor
      const editorIndex = editors.length;
      
      // Initialize CodeMirror
      const editor = CodeMirror(editorDiv, {
        mode: "javascript",
        theme: "monokai",
        value: initialCode,
        extraKeys: {
          "Ctrl-Enter": function(cm) { evalBlock(cm, editorIndex); },
          "Cmd-Enter": function(cm) { evalBlock(cm, editorIndex); },
          "Alt-Enter": function(cm) { evalBlock(cm, editorIndex); },
          "Ctrl-/": function(cm) { toggleComment(cm); },
          "Cmd-/": function(cm) { toggleComment(cm); },
        },
      });
      
      // Track focus
      editor.on('focus', () => {
        document.querySelectorAll('.editor-panel').forEach(p => p.classList.remove('focused'));
        panel.classList.add('focused');
      });
      
      // Broadcast changes to other instances
      editor.on('change', () => {
        if (syncManager && !syncManager.isApplying() && config.sync.sendChanges) {
          syncManager.sendMessage({
            type: 'change',
            editorIndex: editorIndex,
            content: editor.getValue()
          });
        }
      });
      
      // Store editor reference
      editors.push({ editor, panel });
      
      return editor;
    }

    // Toggle visibility function
    function toggleCodeVisibility(cm) {
      const editorContainer = document.getElementById('editor-container');
      if (editorContainer.style.display === 'none') {
        editorContainer.style.display = 'flex';
      } else {
        editorContainer.style.display = 'none';
      }
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Toggle code visibility with Ctrl/Cmd + H
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        toggleCodeVisibility();
      }
      
      // Fullscreen toggle
      if (e.code === 'KeyF' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    });

function hyeval(arg) {
  // Wrap the code string in an async IIFE to permit 'await'
  const asyncWrappedCode = `(async () => { ${arg} })()`;

  try {
    // eval returns a Promise now, so handle async rejections here
    window.eval(asyncWrappedCode).catch((err) => {
      displayEvalError(err);
    });
  } catch (err) {
    // This catches synchronous syntax errors (e.g., misspelled tokens)
    displayEvalError(err);
  }
}

// Helper to keep your error UI logic clean
function displayEvalError(err) {
  const errorDiv = document.getElementById("error");
  errorDiv.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
  setTimeout(() => {
    errorDiv.innerHTML = "";
  }, 3000);
  console.error("Hydra Evaluation error:", err);
}


    function evalBlock(editor, editorIndex) {
      const code = editor.getValue();
      const cursor = editor.getCursor();
      const currentLine = cursor.line;
      // Clear previous marks if any
      if (window.currentBlockMark) {
        window.currentBlockMark.clear();
      }

      // Split code into blocks separated by empty lines
      const lines = code.split("\n");
      const blocks = findBlocks(lines);

      // Find the current code block
      const targetBlock = blocks.find(
        (block) => block.start <= currentLine && currentLine <= block.end
      );

      if (targetBlock) {
        try {
          // Add highlight before execution
          window.currentBlockMark = editor.markText(
            { line: targetBlock.start, ch: 0 },
            { line: targetBlock.end, ch: 1000000 }, // Large number to cover line end
            {
              className: "executed-block-highlight",
              css: config.executeLocally 
                ? "background-color: rgba(255, 255, 255, 1); transition: background-color 0.2s;"
                : "background-color: rgba(255, 150, 0, 0.5); transition: background-color 0.2s;",
            }
          );
          // Remove highlight after 100ms
          setTimeout(() => {
            if (window.currentBlockMark) {
              window.currentBlockMark.clear();
              window.currentBlockMark = null;
            }
          }, 100);

          // Execute code locally only if executeLocally is true
          if (config.executeLocally) {
            hyeval(targetBlock.code);
          }
          
          // Broadcast execution to other instances
          if (syncManager && !syncManager.isApplying() && config.sync.sendExecutions && editorIndex !== undefined) {
            syncManager.sendMessage({
              type: 'execute',
              editorIndex: editorIndex,
              code: targetBlock.code,
              cursorLine: currentLine
            });
          }
        } catch (error) {
          console.error("Evaluation error:", error);
        }
      }
    }

    function evalCode(editor) {
      const code = editor.getValue();
      try {
        // Add highlight before execution
        window.currentBlockMark = editor.markText(
          { line: 0, ch: 0 },
          { line: 1000000, ch: 1000000 }, // Large number to cover line end
          {
            className: "executed-block-highlight",
            css: "background-color: rgba(255, 255, 255, 1); transition: background-color 0.2s;",
          }
        );

        // Execute code
        hyeval(code);

        // Remove highlight after 1 second
        setTimeout(() => {
          if (window.currentBlockMark) {
            window.currentBlockMark.clear();
            window.currentBlockMark = null;
          }
        }, 100);
      } catch (error) {
        console.error("Evaluation error:", error);
      }
    }
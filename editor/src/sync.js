
/**
 * WebSocket Sync Module
 * Handles real-time synchronization between multiple computers
 * Entirely AI generated.
 */

class SyncManager {
  constructor(config, editors, findBlocks, hyeval) {
    this.config = config;
    this.editors = editors;
    this.findBlocks = findBlocks;
    this.hyeval = hyeval;
    this.ws = null;
    this.isApplyingRemoteChange = false;
    // this.syncIndicator = document.getElementById('sync-indicator');
    this.reconnectTimeout = null;
  }

  connect() {
    if (!this.config.sync || !this.config.sync.enabled || !this.config.sync.wsUrl) {
      console.log('WebSocket sync disabled');
    //   this.syncIndicator.style.display = 'none';
      return;
    }

    try {
      this.ws = new WebSocket(this.config.sync.wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        // this.syncIndicator.style.borderColor = '#00ff00';
        // this.syncIndicator.style.color = '#00ff00';
        // this.syncIndicator.innerHTML = '⟲ SYNC ✓';
        
        // Join room
        this.ws.send(JSON.stringify({
          type: 'join',
          room: this.config.sync.room
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          // Handle both text and Blob messages
          if (event.data instanceof Blob) {
            // Convert Blob to text
            event.data.text().then(text => {
              const data = JSON.parse(text);
              this.handleRemoteMessage(data);
            });
          } else {
            // Direct text message
            const data = JSON.parse(event.data);
            this.handleRemoteMessage(data);
          }
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // this.syncIndicator.style.borderColor = '#ff0000';
        // this.syncIndicator.style.color = '#ff0000';
        // this.syncIndicator.innerHTML = '⟲ SYNC ✗';
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        // this.syncIndicator.style.borderColor = '#ff9900';
        // this.syncIndicator.style.color = '#ff9900';
        // this.syncIndicator.innerHTML = '⟲ SYNC …';
        
        // Attempt to reconnect after 3 seconds
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
    //   this.syncIndicator.style.display = 'none';
    }
  }

  handleRemoteMessage(data) {
    const { type, editorIndex, content, code, cursorLine, room } = data;
    
    // Ignore messages from other rooms
    if (room && room !== this.config.sync.room) return;
    
    // Visual feedback for sync activity
    // this.syncIndicator.style.background = 'rgba(255, 0, 255, 0.6)';
    // setTimeout(() => {
    //   this.syncIndicator.style.background = 'rgba(255, 0, 255, 0.2)';
    // }, 200);
    
    if (type === 'change' && this.config.sync.receiveChanges && this.editors[editorIndex]) {
      // Apply remote change
      this.isApplyingRemoteChange = true;
      this.editors[editorIndex].editor.setValue(content);
      this.isApplyingRemoteChange = false;
    } else if (type === 'execute' && this.config.sync.receiveExecutions && this.editors[editorIndex]) {
      // Execute the same block on this instance
      const editor = this.editors[editorIndex].editor;
      this.isApplyingRemoteChange = true;
      
      // Set cursor to the same line to execute the same block
      if (cursorLine !== undefined) {
        editor.setCursor({ line: cursorLine, ch: 0 });
      }
      
      // Execute the code directly
      this.hyeval(code);
      
      // Visual feedback
      const lines = editor.getValue().split("\n");
      const blocks = this.findBlocks(lines);
      const targetBlock = blocks.find(
        (block) => block.start <= cursorLine && cursorLine <= block.end
      );
      
      if (targetBlock) {
        const mark = editor.markText(
          { line: targetBlock.start, ch: 0 },
          { line: targetBlock.end, ch: 1000000 },
          {
            className: "executed-block-highlight",
            css: "background-color: rgba(255, 0, 255, 0.5); transition: background-color 0.2s;",
          }
        );
        setTimeout(() => mark.clear(), 100);
      }
      
      this.isApplyingRemoteChange = false;
    }
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      message.room = this.config.sync.room;
      this.ws.send(JSON.stringify(message));
    }
  }

  isApplying() {
    return this.isApplyingRemoteChange;
  }
}

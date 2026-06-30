export function getStyles(): string {
  return `
    :root {
      --font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
      --bg: var(--vscode-editor-background, #1e1e1e);
      --fg: var(--vscode-foreground, #cccccc);
      --border: var(--vscode-panel-border, #3c3c3c);
      --btn-bg: var(--vscode-button-background, #0e639c);
      --btn-fg: var(--vscode-button-foreground, #ffffff);
      --btn-hover: var(--vscode-button-hoverBackground, #1177bb);
      --secondary-btn-bg: var(--vscode-button-secondaryBackground, #3a3d41);
      --secondary-btn-fg: var(--vscode-button-secondaryForeground, #ffffff);
      --secondary-btn-hover: var(--vscode-button-secondaryHoverBackground, #45494e);
      --card-bg: rgba(255, 255, 255, 0.03);
      --card-border: rgba(255, 255, 255, 0.05);
      --hash-bg: var(--vscode-textPreformat-background, rgba(0, 0, 0, 0.2));
      --hash-fg: var(--vscode-textPreformat-foreground, #ff8c00);
      --success-badge: #4ec9b0;
      --warning-badge: #cca700;
    }

    body {
      font-family: var(--font-family);
      color: var(--fg);
      background-color: var(--bg);
      margin: 0;
      padding: 30px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      box-sizing: border-box;
    }

    .container {
      position: relative;
      width: 100%;
      max-width: 800px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      padding: 24px;
      box-sizing: border-box;
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .icon-container {
      font-size: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      width: 64px;
      height: 64px;
      border-radius: 12px;
      border: 1px solid var(--card-border);
    }

    .title-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-area h1 {
      font-size: 22px;
      font-weight: 600;
      margin: 0;
      color: var(--vscode-editor-foreground, #ffffff);
      word-break: break-all;
    }

    .title-area .subtitle {
      font-size: 13px;
      opacity: 0.7;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .badge.enabled {
      background-color: rgba(78, 201, 176, 0.15);
      color: var(--success-badge);
      border: 1px solid rgba(78, 201, 176, 0.3);
    }

    .badge.disabled {
      background-color: rgba(204, 167, 0, 0.15);
      color: var(--warning-badge);
      border: 1px solid rgba(204, 167, 0, 0.3);
    }

    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    .meta-table tr {
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      transition: background-color 0.2s;
    }

    .meta-table tr:hover {
      background-color: rgba(255, 255, 255, 0.01);
    }

    .meta-table td {
      padding: 12px 8px;
      font-size: 13px;
      vertical-align: top;
    }

    .meta-table td.label {
      font-weight: 500;
      opacity: 0.6;
      width: 140px;
    }

    .meta-table td.value {
      word-break: break-all;
      color: var(--vscode-editor-foreground, #ffffff);
    }

    .hash-value {
      font-family: monospace;
      background: var(--hash-bg);
      color: var(--hash-fg);
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 12px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 24px 0 12px 0;
      opacity: 0.8;
      border-left: 3px solid var(--btn-bg);
      padding-left: 8px;
    }

    .analysis-container {
      background: rgba(0, 0, 0, 0.1);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .analysis-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
    }

    .analysis-item {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 12px;
    }

    .analysis-item .item-label {
      font-size: 11px;
      opacity: 0.6;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .analysis-item .item-value {
      font-size: 14px;
      font-weight: 600;
      word-break: break-all;
    }

    .chip-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    .chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-family: monospace;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      border-top: 1px solid var(--border);
      padding-top: 20px;
    }

    button {
      font-family: var(--font-family);
      font-size: 13px;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: background-color 0.2s, transform 0.1s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }

    button:active {
      transform: scale(0.98);
    }

    button.primary {
      background-color: var(--btn-bg);
      color: var(--btn-fg);
    }

    button.primary:hover {
      background-color: var(--btn-hover);
    }

    button.secondary {
      background-color: var(--secondary-btn-bg);
      color: var(--secondary-btn-fg);
    }

    button.secondary:hover {
      background-color: var(--secondary-btn-hover);
    }

    .fallback-card {
      text-align: center;
      padding: 40px 20px;
    }

    .fallback-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: var(--warning-badge);
    }

    .fallback-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .fallback-desc {
      font-size: 13px;
      opacity: 0.7;
      margin-bottom: 24px;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.5;
    }

    .value-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    
    .value-text {
      word-break: break-all;
    }

    .copy-icon-btn {
      background: transparent;
      border: none;
      padding: 4px 8px;
      cursor: pointer;
      color: var(--fg);
      opacity: 0.6;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s, background-color 0.2s, transform 0.1s;
      border-radius: 4px;
      font-size: 14px;
    }

    .copy-icon-btn:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.08);
    }
    
    .copy-icon-btn:active {
      transform: scale(0.95);
    }

    .settings-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: transparent;
      border: none;
      padding: 6px 10px;
      cursor: pointer;
      color: var(--fg);
      opacity: 0.6;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s, background-color 0.2s, transform 0.1s;
      border-radius: 4px;
      font-size: 16px;
    }

    .settings-btn:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.08);
    }
    
    .settings-btn:active {
      transform: scale(0.95);
    }

    .calculate-btn {
      background-color: var(--btn-bg);
      color: var(--btn-fg);
      border: none;
      padding: 4px 8px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      transition: background-color 0.2s, transform 0.1s;
      flex-shrink: 0;
    }

    .calculate-btn:hover {
      background-color: var(--btn-hover);
    }

    .calculate-btn:active {
      transform: scale(0.96);
    }

    .loading-text {
      font-size: 12px;
      opacity: 0.8;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .spin-icon {
      display: inline-block;
      animation: spin 1.5s linear infinite;
    }

    .dates-container {
      display: flex;
      gap: 32px;
    }

    .date-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .date-label {
      font-size: 10px;
      text-transform: uppercase;
      opacity: 0.5;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .date-value {
      font-size: 13px;
    }
  `;
}

import { useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  Clipboard,
  FileDown,
  FolderOpen,
  ImagePlus,
  Loader2,
  Play,
  Save,
  Settings
} from 'lucide-react';
import type { Diagram, DiagramFormat, MLApiConfig, QueueItem } from '../types/domain';
import { validateImageUrl } from '../utils/validation';

const formats: DiagramFormat[] = ['mermaid', 'plantuml', 'graphviz', 'ascii'];
const providers: MLApiConfig['provider'][] = ['lm-studio', 'openai', 'anthropic'];

function createQueueItem(url: string, format: DiagramFormat): QueueItem {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    url,
    format,
    status: 'pending',
    progress: 0,
    message: 'Ready to process',
    createdAt: now,
    updatedAt: now
  };
}

export function App(): ReactElement {
  const bridge = window.imageDiagram;
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<DiagramFormat>('mermaid');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [config, setConfig] = useState<MLApiConfig>({
    provider: 'lm-studio',
    endpointUrl: 'http://localhost:1234/v1/chat/completions',
    model: 'local-vision-model'
  });
  const [markdown, setMarkdown] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notice, setNotice] = useState('');
  const [urlError, setUrlError] = useState('');

  const completedDiagrams = useMemo(
    () => queue.map((item) => item.diagram).filter((diagram): diagram is Diagram => Boolean(diagram)),
    [queue]
  );

  useEffect(() => {
    if (!bridge) {
      setNotice('Electron preload bridge is unavailable. Restart the app after rebuilding.');
      return;
    }

    void bridge.loadConfig().then((result) => {
      if (result.ok) {
        setConfig(result.data);
      } else if (result.data) {
        setConfig(result.data);
        setNotice(result.error);
      }
    });
  }, [bridge]);

  useEffect(() => {
    if (completedDiagrams.length === 0) {
      return;
    }

    if (!bridge) {
      return;
    }

    void bridge.createMarkdown(completedDiagrams).then((result) => {
      if (result.ok) {
        setMarkdown(result.data);
      }
    });
  }, [bridge, completedDiagrams]);

  function updateQueueItem(id: string, patch: Partial<QueueItem>): void {
    setQueue((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
      )
    );
  }

  function addUrl(): void {
    setUrlError('');
    try {
      const parsed = validateImageUrl(url);
      setQueue((current) => [...current, createQueueItem(parsed.toString(), format)]);
      setUrl('');
    } catch (error) {
      setUrlError(error instanceof Error ? error.message : 'Invalid URL');
    }
  }

  async function saveProviderConfig(): Promise<void> {
    if (!bridge) {
      setNotice('Electron preload bridge is unavailable. Restart the app after rebuilding.');
      return;
    }

    const result = await bridge.saveConfig(config);
    setNotice(result.ok ? 'Provider settings saved.' : result.error);
  }

  async function processQueue(): Promise<void> {
    if (!bridge) {
      setNotice('Electron preload bridge is unavailable. Restart the app after rebuilding.');
      return;
    }

    setIsProcessing(true);
    setNotice('');

    const pendingItems = queue.filter((item) => item.status === 'pending' || item.status === 'failed');
    for (const item of pendingItems) {
      updateQueueItem(item.id, {
        status: 'fetching',
        progress: 35,
        message: 'Fetching image'
      });

      updateQueueItem(item.id, {
        status: 'converting',
        progress: 70,
        message: 'Calling ML provider'
      });

      const result = await bridge.convertDiagram({
        url: item.url,
        format: item.format,
        config
      });

      if (result.ok) {
        updateQueueItem(item.id, {
          status: 'completed',
          progress: 100,
          message: 'Diagram generated',
          error: undefined,
          diagram: result.data
        });
      } else {
        updateQueueItem(item.id, {
          status: 'failed',
          progress: 100,
          message: 'Conversion failed',
          error: result.error
        });
      }
    }

    setIsProcessing(false);
  }

  async function saveMarkdown(): Promise<void> {
    if (!bridge) {
      setNotice('Electron preload bridge is unavailable. Restart the app after rebuilding.');
      return;
    }

    const result = await bridge.saveMarkdown(markdown);
    if (result.ok && !result.data.canceled) {
      setNotice(`Saved to ${result.data.filePath}`);
    } else if (!result.ok) {
      setNotice(result.error);
    }
  }

  async function openMarkdown(): Promise<void> {
    if (!bridge) {
      setNotice('Electron preload bridge is unavailable. Restart the app after rebuilding.');
      return;
    }

    const result = await bridge.openMarkdown();
    if (result.ok && !result.data.canceled && result.data.content) {
      setMarkdown(result.data.content);
      setNotice(`Opened ${result.data.filePath}`);
    } else if (!result.ok) {
      setNotice(result.error);
    }
  }

  async function copyMarkdown(): Promise<void> {
    await navigator.clipboard.writeText(markdown);
    setNotice('Markdown copied to clipboard.');
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>Image to Diagram</h1>
            <p>Convert public image URLs into editable diagram Markdown.</p>
          </div>
          <div className="actions">
            <button className="icon-button" onClick={openMarkdown} title="Open Markdown">
              <FolderOpen size={18} />
            </button>
            <button
              className="icon-button"
              onClick={copyMarkdown}
              disabled={!markdown}
              title="Copy Markdown"
            >
              <Clipboard size={18} />
            </button>
            <button
              className="primary-button"
              onClick={saveMarkdown}
              disabled={!markdown}
              title="Save Markdown"
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </header>

        <div className="content-grid">
          <aside className="left-panel">
            <section className="panel">
              <div className="panel-title">
                <Settings size={18} />
                <h2>Provider</h2>
              </div>
              <label>
                Provider
                <select
                  value={config.provider}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      provider: event.target.value as MLApiConfig['provider']
                    }))
                  }
                >
                  {providers.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Endpoint URL
                <input
                  value={config.endpointUrl}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, endpointUrl: event.target.value }))
                  }
                />
              </label>
              <label>
                Model
                <input
                  value={config.model}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, model: event.target.value }))
                  }
                />
              </label>
              <label>
                API key
                <input
                  type="password"
                  value={config.apiKey ?? ''}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, apiKey: event.target.value || undefined }))
                  }
                />
              </label>
              <button className="secondary-button" onClick={saveProviderConfig}>
                <FileDown size={16} />
                Store config
              </button>
            </section>

            <section className="panel">
              <div className="panel-title">
                <ImagePlus size={18} />
                <h2>Input</h2>
              </div>
              <label>
                Image URL
                <textarea
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com/architecture.png"
                  rows={4}
                />
              </label>
              <label>
                Format
                <select value={format} onChange={(event) => setFormat(event.target.value as DiagramFormat)}>
                  {formats.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              {urlError ? <p className="error-text">{urlError}</p> : null}
              <div className="button-row">
                <button className="secondary-button" onClick={addUrl}>
                  <ImagePlus size={16} />
                  Add
                </button>
                <button
                  className="primary-button"
                  onClick={processQueue}
                  disabled={isProcessing || queue.length === 0}
                >
                  {isProcessing ? <Loader2 className="spin" size={16} /> : <Play size={16} />}
                  Process
                </button>
              </div>
            </section>
          </aside>

          <section className="queue-panel">
            <div className="panel-title">
              <h2>Queue</h2>
              <span>{queue.length} item(s)</span>
            </div>
            <div className="queue-list">
              {queue.length === 0 ? (
                <div className="empty-state">Add a public JPG, PNG, BMP, or SVG URL.</div>
              ) : (
                queue.map((item) => (
                  <article key={item.id} className="queue-item">
                    <div>
                      <strong>{item.format}</strong>
                      <p>{item.url}</p>
                    </div>
                    <div className="status-line">
                      <span className={`status-pill ${item.status}`}>{item.status}</span>
                      <span>{item.message}</span>
                    </div>
                    <div className="progress">
                      <div style={{ width: `${item.progress}%` }} />
                    </div>
                    {item.error ? <p className="error-text">{item.error}</p> : null}
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="preview-panel">
            <div className="panel-title">
              <h2>Markdown Preview</h2>
              <span>{markdown.length} chars</span>
            </div>
            <textarea
              className="markdown-editor"
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              placeholder="Generated Markdown appears here."
            />
          </section>
        </div>
        {notice ? <div className="notice">{notice}</div> : null}
      </section>
    </main>
  );
}

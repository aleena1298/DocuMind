import { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, LoaderCircle } from 'lucide-react';

export default function UploadCard({ onUpload, busy }) {
  const inputRef = useRef();
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);

  function choose(files) {
    const chosen = files?.[0];
    if (chosen) setFile(chosen);
  }

  async function submit() {
    if (!file || busy) return;
    await onUpload(file);
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <section className="panel upload-panel">
      <div className="section-heading">
        <div><span className="eyebrow">NEW ANALYSIS</span><h2>Upload a document image</h2></div>
        <span className="secure-pill">Private by default</span>
      </div>
      <div
        className={`dropzone ${drag ? 'drag' : ''}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); choose(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e => choose(e.target.files)} />
        <div className="upload-icon"><UploadCloud size={30} /></div>
        {file ? <>
          <strong>{file.name}</strong>
          <span>{(file.size / 1024 / 1024).toFixed(2)} MB · ready to process</span>
        </> : <>
          <strong>Drop a scan here, or click to browse</strong>
          <span>JPG, PNG or WebP · max 8 MB</span>
        </>}
      </div>
      <div className="upload-footer">
        <div className="microcopy"><ImageIcon size={15} /> OCR → structure → summary → document Q&A</div>
        <button className="primary-btn" disabled={!file || busy} onClick={submit}>
          {busy ? <><LoaderCircle className="spin" size={17} /> Processing OCR…</> : 'Analyze document'}
        </button>
      </div>
    </section>
  );
}
